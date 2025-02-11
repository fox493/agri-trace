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
	ID              string          `json:"id"`              // 产品ID
	Name            string          `json:"name"`            // 产品名称
	BatchNumber     string          `json:"batchNumber"`     // 批次号
	Category        string          `json:"category"`        // 产品类别
	Description     string          `json:"description"`     // 产品描述
	ProductionInfo  ProductionInfo  `json:"productionInfo"`  // 生产信息
	ProcessingInfo  ProcessingInfo  `json:"processingInfo"`  // 加工信息
	LogisticsInfo   []LogisticsInfo `json:"logisticsInfo"`   // 物流信息
	QualityInfo     []QualityInfo   `json:"qualityInfo"`     // 质量检测信息
	RetailInfo      RetailInfo      `json:"retailInfo"`      // 零售信息
	Status          string          `json:"status"`          // 产品状态：PLANTED, HARVESTED, PROCESSING, SHIPPING, SELLING, SOLD
	CreatedAt       time.Time       `json:"createdAt"`       // 创建时间
	UpdatedAt       time.Time       `json:"updatedAt"`       // 更新时间
}

// ProductionInfo 生产信息
type ProductionInfo struct {
	FarmID        string    `json:"farmId"`        // 农场ID
	FarmName      string    `json:"farmName"`      // 农场名称
	Location      Location  `json:"location"`      // 种植地点
	PlantingDate  string    `json:"plantingDate"`  // 种植日期
	HarvestDate   string    `json:"harvestDate"`   // 收获日期
	FarmingMethod string    `json:"farmingMethod"` // 种植方法
	Fertilizers   []string  `json:"fertilizers"`   // 使用的肥料
	Pesticides    []string  `json:"pesticides"`    // 使用的农药
	Weather       []Weather `json:"weather"`       // 天气记录
}

// ProcessingInfo 加工信息
type ProcessingInfo struct {
	ProcessorID   string    `json:"processorId"`   // 加工商ID
	ProcessorName string    `json:"processorName"` // 加工商名称
	Location      Location  `json:"location"`      // 加工地点
	ProcessDate   time.Time `json:"processDate"`   // 加工日期
	ProcessMethod string    `json:"processMethod"` // 加工方法
	Temperature   float64   `json:"temperature"`   // 加工温度
	Humidity      float64   `json:"humidity"`      // 加工环境湿度
}

// LogisticsInfo 物流信息
type LogisticsInfo struct {
	CarrierID     string    `json:"carrierId"`     // 承运商ID
	CarrierName   string    `json:"carrierName"`   // 承运商名称
	TransportType string    `json:"transportType"` // 运输方式
	FromLocation  Location  `json:"fromLocation"`  // 起始地点
	ToLocation    Location  `json:"toLocation"`    // 目的地点
	StartTime     time.Time `json:"startTime"`     // 开始时间
	EndTime       time.Time `json:"endTime"`       // 结束时间
	Temperature   float64   `json:"temperature"`   // 运输温度
	Humidity      float64   `json:"humidity"`      // 运输湿度
}

// QualityInfo 质量检测信息
type QualityInfo struct {
	InspectorID     string    `json:"inspectorId"`     // 检测机构ID
	InspectorName   string    `json:"inspectorName"`   // 检测机构名称
	InspectionDate  time.Time `json:"inspectionDate"`  // 检测日期
	ExpirationDate  time.Time `json:"expirationDate"`  // 过期日期
	Standards       []string  `json:"standards"`       // 检测标准
	Results         []string  `json:"results"`         // 检测结果
	Certifications  []string  `json:"certifications"`  // 认证信息
}

// RetailInfo 零售信息
type RetailInfo struct {
	RetailerID   string    `json:"retailerId"`   // 零售商ID
	RetailerName string    `json:"retailerName"` // 零售商名称
	Location     Location  `json:"location"`     // 销售地点
	Price        float64   `json:"price"`        // 销售价格
	SaleDate     time.Time `json:"saleDate"`     // 销售日期
}

// Location 位置信息
type Location struct {
	Latitude  float64 `json:"latitude"`  // 纬度
	Longitude float64 `json:"longitude"` // 经度
	Address   string  `json:"address"`   // 详细地址
}

// Weather 天气记录
type Weather struct {
	Date        time.Time `json:"date"`        // 日期
	Temperature float64   `json:"temperature"` // 温度
	Humidity    float64   `json:"humidity"`    // 湿度
	Rainfall    float64   `json:"rainfall"`    // 降雨量
}

// InitLedger 初始化账本
func (t *AgriTrace) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateProduct 创建新的农产品记录
func (t *AgriTrace) CreateProduct(ctx contractapi.TransactionContextInterface, productData string) error {
	// 检查调用者身份
	err := t.checkRole(ctx, []string{"Producers"})
	if err != nil {
		return fmt.Errorf("无权限创建产品: %v", err)
	}

	var product Product
	err = json.Unmarshal([]byte(productData), &product)
	if err != nil {
		return fmt.Errorf("解析产品数据失败: %v", err)
	}

	exists, err := t.ProductExists(ctx, product.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("产品已存在: %s", product.ID)
	}

	// 设置初始状态
	product.Status = "PLANTED"
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	// 记录创建事件
	err = ctx.GetStub().SetEvent("ProductCreated", productJSON)
	if err != nil {
		return fmt.Errorf("记录事件失败: %v", err)
	}

	return ctx.GetStub().PutState(product.ID, productJSON)
}

// UpdateProductionInfo 更新生产信息
func (t *AgriTrace) UpdateProductionInfo(ctx contractapi.TransactionContextInterface, productID string, productionData string) error {
	err := t.checkRole(ctx, []string{"Producers"})
	if err != nil {
		return fmt.Errorf("无权限更新生产信息: %v", err)
	}

	var productionInfo ProductionInfo
	err = json.Unmarshal([]byte(productionData), &productionInfo)
	if err != nil {
		return fmt.Errorf("解析生产数据失败: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.ProductionInfo = productionInfo
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// UpdateProcessingInfo 更新加工信息
func (t *AgriTrace) UpdateProcessingInfo(ctx contractapi.TransactionContextInterface, productID string, processingData string) error {
	err := t.checkRole(ctx, []string{"Producers", "Logistics"})
	if err != nil {
		return fmt.Errorf("无权限更新加工信息: %v", err)
	}

	var processingInfo ProcessingInfo
	err = json.Unmarshal([]byte(processingData), &processingInfo)
	if err != nil {
		return fmt.Errorf("解析加工数据失败: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.ProcessingInfo = processingInfo
	product.Status = "PROCESSING"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// AddLogisticsInfo 添加物流信息
func (t *AgriTrace) AddLogisticsInfo(ctx contractapi.TransactionContextInterface, productID string, logisticsData string) error {
	err := t.checkRole(ctx, []string{"Logistics"})
	if err != nil {
		return fmt.Errorf("无权限添加物流信息: %v", err)
	}

	var logisticsInfo LogisticsInfo
	err = json.Unmarshal([]byte(logisticsData), &logisticsInfo)
	if err != nil {
		return fmt.Errorf("解析物流数据失败: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.LogisticsInfo = append(product.LogisticsInfo, logisticsInfo)
	product.Status = "SHIPPING"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// AddQualityInfo 添加质量检测信息
func (t *AgriTrace) AddQualityInfo(ctx contractapi.TransactionContextInterface, productID string, qualityData string) error {
	err := t.checkRole(ctx, []string{"Producers", "Logistics", "Retailers"})
	if err != nil {
		return fmt.Errorf("无权限添加质量检测信息: %v", err)
	}

	var qualityInfo QualityInfo
	err = json.Unmarshal([]byte(qualityData), &qualityInfo)
	if err != nil {
		return fmt.Errorf("解析质量检测数据失败: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.QualityInfo = append(product.QualityInfo, qualityInfo)
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// UpdateRetailInfo 更新零售信息
func (t *AgriTrace) UpdateRetailInfo(ctx contractapi.TransactionContextInterface, productID string, retailData string) error {
	err := t.checkRole(ctx, []string{"Retailers"})
	if err != nil {
		return fmt.Errorf("无权限更新零售信息: %v", err)
	}

	var retailInfo RetailInfo
	err = json.Unmarshal([]byte(retailData), &retailInfo)
	if err != nil {
		return fmt.Errorf("解析零售数据失败: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.RetailInfo = retailInfo
	product.Status = "SELLING"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// SellProduct 售出产品
func (t *AgriTrace) SellProduct(ctx contractapi.TransactionContextInterface, productID string) error {
	err := t.checkRole(ctx, []string{"Retailers"})
	if err != nil {
		return fmt.Errorf("无权限更新销售状态: %v", err)
	}

	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	product.Status = "SOLD"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// QueryProduct 查询农产品信息
func (t *AgriTrace) QueryProduct(ctx contractapi.TransactionContextInterface, id string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("获取产品信息失败: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("产品不存在: %s", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// QueryProductsByBatch 按批次查询产品
func (t *AgriTrace) QueryProductsByBatch(ctx contractapi.TransactionContextInterface, batchNumber string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"batchNumber":"%s"}}`, batchNumber)
	return t.queryProducts(ctx, queryString)
}

// QueryProductsByStatus 按状态查询产品
func (t *AgriTrace) QueryProductsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return t.queryProducts(ctx, queryString)
}

// QueryProductsByDateRange 按时间范围查询产品
func (t *AgriTrace) QueryProductsByDateRange(ctx contractapi.TransactionContextInterface, startDate string, endDate string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"createdAt":{"$gte":"%s","$lte":"%s"}}}`, startDate, endDate)
	return t.queryProducts(ctx, queryString)
}

// queryProducts 通用查询函数
func (t *AgriTrace) queryProducts(ctx contractapi.TransactionContextInterface, queryString string) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var product Product
		err = json.Unmarshal(queryResult.Value, &product)
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}

	return products, nil
}

// ProductExists 检查农产品是否存在
func (t *AgriTrace) ProductExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("查询产品状态失败: %v", err)
	}

	return productJSON != nil, nil
}

// checkRole 检查调用者角色
func (t *AgriTrace) checkRole(ctx contractapi.TransactionContextInterface, allowedOrgs []string) error {
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("获取身份信息失败: %v", err)
	}

	for _, org := range allowedOrgs {
		if mspID == org+"MSP" {
			return nil
		}
	}

	return fmt.Errorf("组织 %s 无权限执行此操作", mspID)
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