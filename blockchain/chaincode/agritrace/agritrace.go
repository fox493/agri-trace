package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// AgriTrace 定义智能合约结构
type AgriTrace struct {
	contractapi.Contract
}

// Product 定义农产品结构
type Product struct {
	ID           string    `json:"id"`           // 产品ID
	Name         string    `json:"name"`         // 产品名称
	Area         float64   `json:"area"`         // 种植面积（亩）
	PlantingDate string    `json:"plantingDate"` // 种植日期
	HarvestDate  string    `json:"harvestDate"`  // 收获日期（可选）
	Status       string    `json:"status"`       // 状态：PLANTING（种植中）, HARVESTED（已收获）
	FarmerID     string    `json:"farmerId"`     // 农户ID
	Location     string    `json:"location"`     // 种植地点
	CreatedAt    time.Time `json:"createdAt"`    // 创建时间
	UpdatedAt    time.Time `json:"updatedAt"`    // 更新时间
}

// ProductionRecord 定义生产记录结构
type ProductionRecord struct {
	ID          string    `json:"id"`          // 记录ID
	ProductID   string    `json:"productId"`   // 产品ID
	Type        string    `json:"type"`        // 记录类型：PLANTING（播种）, FERTILIZING（施肥）, HARVESTING（收获）
	Date        string    `json:"date"`        // 操作日期
	Description string    `json:"description"` // 操作描述
	OperatorID  string    `json:"operatorId"`  // 操作人ID
	CreatedAt   time.Time `json:"createdAt"`   // 创建时间
}

// EnvironmentRecord 环境记录结构
type EnvironmentRecord struct {
	ID          string    `json:"id"`          // 记录ID
	ProductID   string    `json:"productId"`   // 产品ID
	Temperature float64   `json:"temperature"` // 温度
	Humidity    float64   `json:"humidity"`   // 湿度
	RecordTime  time.Time `json:"recordTime"`  // 记录时间
	OperatorID  string    `json:"operatorId"`  // 记录人ID
}

// QualityRecord 质量检测记录
type QualityRecord struct {
	ID          string    `json:"id"`          // 记录ID
	ProductID   string    `json:"productId"`   // 产品ID
	TestType    string    `json:"testType"`    // 检测类型
	Result      string    `json:"result"`      // 检测结果
	IsQualified bool      `json:"isQualified"` // 是否合格
	RecordTime  time.Time `json:"recordTime"`  // 记录时间
	InspectorID string    `json:"inspectorId"` // 检测员ID
}

// InitLedger 初始化账本
func (t *AgriTrace) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateProduct 创建新的农产品记录
func (t *AgriTrace) CreateProduct(ctx contractapi.TransactionContextInterface, productData string) error {
	var product Product
	err := json.Unmarshal([]byte(productData), &product)
	if err != nil {
		return fmt.Errorf("解析产品数据失败: %v", err)
	}

	// 检查产品ID是否已存在
	exists, err := t.ProductExists(ctx, product.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("产品已存在: %s", product.ID)
	}

	// 设置初始状态和时间
	product.Status = "PLANTING"
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.ID, productJSON)
}

// AddProductionRecord 添加生产记录
func (t *AgriTrace) AddProductionRecord(ctx contractapi.TransactionContextInterface, recordData string) error {
	var record ProductionRecord
	err := json.Unmarshal([]byte(recordData), &record)
	if err != nil {
		return fmt.Errorf("解析记录数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, record.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", record.ProductID)
	}

	// 设置创建时间
	record.CreatedAt = time.Now()

	// 如果是收获记录，更新产品状态
	if record.Type == "HARVESTING" {
		product, err := t.QueryProduct(ctx, record.ProductID)
		if err != nil {
			return err
		}
		product.Status = "HARVESTED"
		product.HarvestDate = record.Date
		product.UpdatedAt = time.Now()

		productJSON, err := json.Marshal(product)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(record.ProductID, productJSON)
		if err != nil {
			return err
		}
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(record.ID, recordJSON)
}

// UpdateProductStatus 更新产品状态
func (t *AgriTrace) UpdateProductStatus(ctx contractapi.TransactionContextInterface, productID string, status string) error {
	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.Status = status
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// QueryProduct 查询产品信息
func (t *AgriTrace) QueryProduct(ctx contractapi.TransactionContextInterface, productID string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(productID)
	if err != nil {
		return nil, fmt.Errorf("查询产品失败: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("产品不存在: %s", productID)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// QueryProductsByFarmer 查询农户的所有产品
func (t *AgriTrace) QueryProductsByFarmer(ctx contractapi.TransactionContextInterface, farmerID string) (string, error) {
	// 使用 GetStateByRange 替代 GetQueryResult
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var product Product
		err = json.Unmarshal(queryResult.Value, &product)
		if err != nil {
			continue // 跳过非产品记录
		}

		// 在内存中过滤农户的产品
		if product.FarmerID == farmerID {
			products = append(products, &product)
		}
	}

	// 确保即使没有找到产品也返回有效的 JSON 数组
	if products == nil {
		products = []*Product{}
	}

	// 将结果转换为 JSON 字符串
	productsJSON, err := json.Marshal(products)
	if err != nil {
		return "", fmt.Errorf("转换产品列表为 JSON 失败: %v", err)
	}

	return string(productsJSON), nil
}

// ProductExists 检查产品是否存在
func (t *AgriTrace) ProductExists(ctx contractapi.TransactionContextInterface, productID string) (bool, error) {
	productJSON, err := ctx.GetStub().GetState(productID)
	if err != nil {
		return false, fmt.Errorf("查询产品失败: %v", err)
	}
	return productJSON != nil, nil
}

// AddEnvironmentRecord 添加环境记录
func (t *AgriTrace) AddEnvironmentRecord(ctx contractapi.TransactionContextInterface, recordData string) error {
	var record EnvironmentRecord
	err := json.Unmarshal([]byte(recordData), &record)
	if err != nil {
		return fmt.Errorf("解析环境记录数据失败: %v", err)
	}
	
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, record.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", record.ProductID)
	}
	
	// 设置记录时间
	record.RecordTime = time.Now()
	
	// 检查是否有异常
	if record.Temperature > 35 || record.Temperature < 0 {
		// 触发温度异常警报
		return fmt.Errorf("温度异常警报: %f", record.Temperature)
	}
	
	if record.Humidity < 0 || record.Humidity > 100 {
		// 触发湿度异常警报
		return fmt.Errorf("湿度异常警报: %f", record.Humidity)
	}
	
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}
	
	return ctx.GetStub().PutState(record.ID, recordJSON)
}

// AddQualityRecord 添加质量检测记录
func (t *AgriTrace) AddQualityRecord(ctx contractapi.TransactionContextInterface, recordData string) error {
	var record QualityRecord
	err := json.Unmarshal([]byte(recordData), &record)
	if err != nil {
		return fmt.Errorf("解析质量检测记录数据失败: %v", err)
	}
	
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, record.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", record.ProductID)
	}
	
	// 设置记录时间
	record.RecordTime = time.Now()
	
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}
	
	return ctx.GetStub().PutState(record.ID, recordJSON)
}

// QueryEnvironmentRecords 查询产品的环境记录
func (t *AgriTrace) QueryEnvironmentRecords(ctx contractapi.TransactionContextInterface, productID string) ([]*EnvironmentRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*EnvironmentRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record EnvironmentRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非环境记录
		}

		// 在内存中过滤指定产品的记录
		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// QueryQualityRecords 查询产品的质量检测记录
func (t *AgriTrace) QueryQualityRecords(ctx contractapi.TransactionContextInterface, productID string) ([]*QualityRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*QualityRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record QualityRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非质量检测记录
		}

		// 在内存中过滤指定产品的记录
		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// QueryProductionRecords 查询产品的生产记录
func (t *AgriTrace) QueryProductionRecords(ctx contractapi.TransactionContextInterface, productID string) ([]*ProductionRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*ProductionRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record ProductionRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非生产记录
		}

		// 在内存中过滤指定产品的记录
		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	return records, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AgriTrace{})
	if err != nil {
		fmt.Printf("Error creating AgriTrace chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting AgriTrace chaincode: %s", err.Error())
	}
} 