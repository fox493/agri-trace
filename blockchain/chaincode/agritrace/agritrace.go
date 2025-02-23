package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
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
	Status       string    `json:"status"`       // 状态：PLANTING（种植中）, HARVESTED（已收获）, ON_SALE（在售）, SOLD_OUT（已售罄）, OFF_SHELF（下架）
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
	Stage       string    `json:"stage"`       // 检测阶段：PLANTING（播种）, GROWING（生长）, HARVESTING（收获）
	TestType    string    `json:"testType"`    // 检测类型
	Result      string    `json:"result"`      // 检测结果
	IsQualified bool      `json:"isQualified"` // 是否合格
	RecordTime  time.Time `json:"recordTime"`  // 记录时间
	InspectorID string    `json:"inspectorId"` // 检测员ID
}

// LogisticsRecord 物流记录结构
type LogisticsRecord struct {
	ID          string    `json:"id"`          // 记录ID
	ProductID   string    `json:"productId"`   // 产品ID
	Location    string    `json:"location"`    // 当前位置
	Status      string    `json:"status"`      // 运输状态：IN_TRANSIT（运输中）, DELIVERED（已送达）
	Description string    `json:"description"` // 物流描述
	OperatorID  string    `json:"operatorId"`  // 操作人ID
	RecordTime  time.Time `json:"recordTime"`  // 记录时间
}

// RetailInventory 零售库存结构
type RetailInventory struct {
	ID          string    `json:"id"`          // 库存记录ID
	ProductID   string    `json:"productId"`   // 产品ID
	RetailerID  string    `json:"retailerId"`  // 零售商ID
	Quantity    int       `json:"quantity"`    // 库存数量
	MinQuantity int       `json:"minQuantity"` // 最小库存预警
	UpdatedAt   time.Time `json:"updatedAt"`   // 更新时间
}

// SalesRecord 销售记录结构
type SalesRecord struct {
	ID           string    `json:"id"`           // 记录ID
	ProductID    string    `json:"productId"`    // 产品ID
	RetailerID   string    `json:"retailerId"`   // 零售商ID
	ConsumerID   string    `json:"consumerId"`   // 消费者ID
	Quantity     int       `json:"quantity"`     // 销售数量
	UnitPrice    float64   `json:"unitPrice"`    // 销售单价
	TotalAmount  float64   `json:"totalAmount"`  // 销售总额
	SaleTime     time.Time `json:"saleTime"`     // 销售时间
	PaymentType  string    `json:"paymentType"`  // 支付方式
	PurchaseCode string    `json:"purchaseCode"` // 购买凭证码
}

// ConsumerPurchase 消费者购买记录结构
type ConsumerPurchase struct {
	ID           string    `json:"id"`           // 记录ID
	SalesID      string    `json:"salesId"`      // 销售记录ID
	ProductID    string    `json:"productId"`    // 产品ID
	ConsumerID   string    `json:"consumerId"`   // 消费者ID
	RetailerID   string    `json:"retailerId"`   // 零售商ID
	Quantity     int       `json:"quantity"`     // 购买数量
	UnitPrice    float64   `json:"unitPrice"`    // 购买单价
	TotalAmount  float64   `json:"totalAmount"`  // 总金额
	PurchaseTime time.Time `json:"purchaseTime"` // 购买时间
	PaymentType  string    `json:"paymentType"`  // 支付方式
	PurchaseCode string    `json:"purchaseCode"` // 购买凭证码
}

// PriceRecord 价格记录结构
type PriceRecord struct {
	ID         string    `json:"id"`         // 记录ID
	ProductID  string    `json:"productId"`  // 产品ID
	RetailerID string    `json:"retailerId"` // 零售商ID
	Price      float64   `json:"price"`      // 价格
	StartTime  time.Time `json:"startTime"`  // 生效时间
	EndTime    time.Time `json:"endTime"`    // 结束时间
	Status     string    `json:"status"`     // 状态：ACTIVE, INACTIVE
}

// Consumer 消费者结构
type Consumer struct {
	ID        string    `json:"id"`         // 消费者ID
	Name      string    `json:"name"`       // 消费者姓名
	Phone     string    `json:"phone"`      // 联系电话
	CreatedAt time.Time `json:"createdAt"`  // 注册时间
}

// ProductFeedback 消费者反馈结构
type ProductFeedback struct {
	ID          string    `json:"id"`          // 反馈ID
	ProductID   string    `json:"productId"`   // 产品ID
	ConsumerID  string    `json:"consumerId"`  // 消费者ID
	Rating      int       `json:"rating"`      // 评分(1-5)
	Comment     string    `json:"comment"`     // 评价内容
	CreatedAt   time.Time `json:"createdAt"`   // 创建时间
}

// Retailer 零售商结构
type Retailer struct {
	ID        string    `json:"id"`        // 零售商ID
	Name      string    `json:"name"`      // 零售商名称
	Address   string    `json:"address"`   // 地址
	Phone     string    `json:"phone"`     // 联系电话
	CreatedAt time.Time `json:"createdAt"` // 注册时间
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

	// 按阶段和时间排序
	sort.Slice(records, func(i, j int) bool {
		// 首先按阶段排序：HARVESTING > GROWING > PLANTING
		stageOrder := map[string]int{
			"HARVESTING": 3,
			"GROWING":   2,
			"PLANTING":  1,
		}
		if stageOrder[records[i].Stage] != stageOrder[records[j].Stage] {
			return stageOrder[records[i].Stage] > stageOrder[records[j].Stage]
		}
		// 如果阶段相同，则按时间倒序
		return records[i].RecordTime.After(records[j].RecordTime)
	})

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

// QueryProductsByStatus 按状态查询产品
func (t *AgriTrace) QueryProductsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
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
			continue // 跳过非产品记录
		}

		// 在内存中过滤指定状态的产品
		if product.Status == status {
			products = append(products, &product)
		}
	}

	return products, nil
}

// QueryQualityRecordsByInspector 查询质检员的检测记录
func (t *AgriTrace) QueryQualityRecordsByInspector(ctx contractapi.TransactionContextInterface, inspectorID string) ([]*QualityRecord, error) {
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

		// 在内存中过滤指定质检员的记录
		if record.InspectorID == inspectorID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// AddLogisticsRecord 添加物流记录
func (t *AgriTrace) AddLogisticsRecord(ctx contractapi.TransactionContextInterface, recordData string) error {
	var record LogisticsRecord
	err := json.Unmarshal([]byte(recordData), &record)
	if err != nil {
		return fmt.Errorf("解析物流记录数据失败: %v", err)
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

// QueryLogisticsRecordsByOperator 查询操作员的物流记录
func (t *AgriTrace) QueryLogisticsRecordsByOperator(ctx contractapi.TransactionContextInterface, operatorID string) (string, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var records []*LogisticsRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var record LogisticsRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非物流记录
		}

		// 在内存中过滤指定操作员的记录
		if record.OperatorID == operatorID {
			records = append(records, &record)
		}
	}

	// 确保即使没有找到记录也返回有效的 JSON 数组
	if records == nil {
		records = []*LogisticsRecord{}
	}

	// 将结果转换为 JSON 字符串
	recordsJSON, err := json.Marshal(records)
	if err != nil {
		return "", fmt.Errorf("转换物流记录列表为 JSON 失败: %v", err)
	}

	return string(recordsJSON), nil
}

// QueryLogisticsRecord 查询单个物流记录
func (t *AgriTrace) QueryLogisticsRecord(ctx contractapi.TransactionContextInterface, recordID string) (*LogisticsRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return nil, fmt.Errorf("查询物流记录失败: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("物流记录不存在: %s", recordID)
	}

	var record LogisticsRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// QueryLogisticsRecordsByProduct 查询产品的物流记录
func (t *AgriTrace) QueryLogisticsRecordsByProduct(ctx contractapi.TransactionContextInterface, productID string) ([]*LogisticsRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*LogisticsRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record LogisticsRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非物流记录
		}

		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// UpdateLogisticsRecord 更新物流记录状态
func (t *AgriTrace) UpdateLogisticsRecord(ctx contractapi.TransactionContextInterface, recordID string, status string, location string, description string) error {
	record, err := t.QueryLogisticsRecord(ctx, recordID)
	if err != nil {
		return err
	}

	// 更新记录信息
	record.Status = status
	record.Location = location
	record.Description = description
	record.RecordTime = time.Now()

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

// AddRetailInventory 添加零售库存记录
func (t *AgriTrace) AddRetailInventory(ctx contractapi.TransactionContextInterface, inventoryData string) error {
	var inventory RetailInventory
	err := json.Unmarshal([]byte(inventoryData), &inventory)
	if err != nil {
		return fmt.Errorf("解析库存数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, inventory.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", inventory.ProductID)
	}

	// 确保ID有正确的前缀
	if !strings.HasPrefix(inventory.ID, "INV_") {
		inventory.ID = fmt.Sprintf("INV_%s", inventory.ID)
	}

	// 设置更新时间
	inventory.UpdatedAt = time.Now()

	inventoryJSON, err := json.Marshal(inventory)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(inventory.ID, inventoryJSON)
}

// UpdateInventoryQuantity 更新库存数量
func (t *AgriTrace) UpdateInventoryQuantity(ctx contractapi.TransactionContextInterface, inventoryID string, quantity int) error {
	inventoryJSON, err := ctx.GetStub().GetState(inventoryID)
	if err != nil {
		return fmt.Errorf("查询库存记录失败: %v", err)
	}
	if inventoryJSON == nil {
		return fmt.Errorf("库存记录不存在: %s", inventoryID)
	}

	var inventory RetailInventory
	err = json.Unmarshal(inventoryJSON, &inventory)
	if err != nil {
		return err
	}

	// 更新库存数量和时间
	inventory.Quantity = quantity
	inventory.UpdatedAt = time.Now()

	// 检查是否低于最小库存
	if quantity <= inventory.MinQuantity {
		// 触发库存预警
		fmt.Printf("库存预警: 产品 %s 库存数量 %d 低于最小库存 %d\n", 
			inventory.ProductID, quantity, inventory.MinQuantity)
	}

	inventoryJSON, err = json.Marshal(inventory)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(inventoryID, inventoryJSON)
}

// QueryInventoryByRetailer 查询零售商的库存
func (t *AgriTrace) QueryInventoryByRetailer(ctx contractapi.TransactionContextInterface, retailerId string) ([]*RetailInventory, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var inventories []*RetailInventory
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// 只处理以INV_开头的记录
		if !strings.HasPrefix(queryResult.Key, "INV_") {
			continue
		}

		var inventory RetailInventory
		err = json.Unmarshal(queryResult.Value, &inventory)
		if err != nil {
			continue // 跳过非库存记录
		}

		if inventory.RetailerID == retailerId {
			inventories = append(inventories, &inventory)
		}
	}

	return inventories, nil
}

// AddSalesRecord 添加销售记录
func (t *AgriTrace) AddSalesRecord(ctx contractapi.TransactionContextInterface, recordData string) error {
	var record SalesRecord
	err := json.Unmarshal([]byte(recordData), &record)
	if err != nil {
		return fmt.Errorf("解析销售记录数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, record.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", record.ProductID)
	}

	// 确保ID有正确的前缀
	if !strings.HasPrefix(record.ID, "SALE_") {
		record.ID = fmt.Sprintf("SALE_%s", record.ID)
	}

	// 设置销售时间
	record.SaleTime = time.Now()
	// 计算总金额
	record.TotalAmount = record.UnitPrice * float64(record.Quantity)

	// 更新库存
	inventories, err := t.QueryInventoryByRetailer(ctx, record.RetailerID)
	if err != nil {
		return err
	}

	var inventory *RetailInventory
	for _, inv := range inventories {
		if inv.ProductID == record.ProductID {
			inventory = inv
			break
		}
	}

	if inventory == nil {
		return fmt.Errorf("未找到相关库存记录")
	}

	if inventory.Quantity < record.Quantity {
		return fmt.Errorf("库存不足: 当前库存 %d, 需要数量 %d", inventory.Quantity, record.Quantity)
	}

	// 更新库存数量
	err = t.UpdateInventoryQuantity(ctx, inventory.ID, inventory.Quantity-record.Quantity)
	if err != nil {
		return err
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(record.ID, recordJSON)
}

// QuerySalesByRetailer 查询零售商的销售记录
func (t *AgriTrace) QuerySalesByRetailer(ctx contractapi.TransactionContextInterface, retailerID string) ([]*SalesRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*SalesRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// 只处理以SALE_开头的记录
		if !strings.HasPrefix(queryResult.Key, "SALE_") {
			continue
		}

		var record SalesRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			continue // 跳过非销售记录
		}

		if record.RetailerID == retailerID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// SetProductPrice 设置产品价格
func (t *AgriTrace) SetProductPrice(ctx contractapi.TransactionContextInterface, priceData string) error {
	var price PriceRecord
	err := json.Unmarshal([]byte(priceData), &price)
	if err != nil {
		return fmt.Errorf("解析价格数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, price.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", price.ProductID)
	}

	// 设置价格记录状态和时间
	price.Status = "ACTIVE"
	price.StartTime = time.Now()

	// 将之前的价格记录设置为失效
	oldPrices, err := t.QueryPriceHistory(ctx, price.ProductID)
	if err != nil {
		return err
	}

	for _, oldPrice := range oldPrices {
		if oldPrice.Status == "ACTIVE" {
			oldPrice.Status = "INACTIVE"
			oldPrice.EndTime = price.StartTime
			oldPriceJSON, err := json.Marshal(oldPrice)
			if err != nil {
				return err
			}
			err = ctx.GetStub().PutState(oldPrice.ID, oldPriceJSON)
			if err != nil {
				return err
			}
		}
	}

	priceJSON, err := json.Marshal(price)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(price.ID, priceJSON)
}

// QueryPriceHistory 查询价格历史
func (t *AgriTrace) QueryPriceHistory(ctx contractapi.TransactionContextInterface, productID string) ([]*PriceRecord, error) {
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, productID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return []*PriceRecord{}, nil  // 如果产品不存在，返回空数组
	}

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*PriceRecord
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// 只处理以PRICE_开头的记录
		if !strings.HasPrefix(queryResult.Key, "PRICE_") {
			continue
		}

		var record PriceRecord
		err = json.Unmarshal(queryResult.Value, &record)
		if err != nil {
			// 记录解析错误但继续处理其他记录
			fmt.Printf("Warning: Failed to parse price record: %v\n", err)
			continue
		}

		// 验证记录的完整性
		if record.ProductID == "" || record.RetailerID == "" {
			continue // 跳过无效记录
		}

		if record.ProductID == productID {
			// 确保时间字段有值
			if record.StartTime.IsZero() {
				record.StartTime = time.Now()
			}
			if record.EndTime.IsZero() {
				record.EndTime = time.Time{}  // 使用零值表示未结束
			}
			records = append(records, &record)
		}
	}

	// 如果没有找到记录，返回空数组而不是 nil
	if records == nil {
		records = []*PriceRecord{}
	}

	// 按时间排序
	sort.Slice(records, func(i, j int) bool {
		return records[i].StartTime.After(records[j].StartTime)
	})

	return records, nil
}

// QueryCurrentPrice 查询当前价格
func (t *AgriTrace) QueryCurrentPrice(ctx contractapi.TransactionContextInterface, productID string) (*PriceRecord, error) {
	records, err := t.QueryPriceHistory(ctx, productID)
	if err != nil {
		return nil, err
	}

	for _, record := range records {
		if record.Status == "ACTIVE" {
			return record, nil
		}
	}

	return nil, fmt.Errorf("未找到产品当前价格: %s", productID)
}

// PutProductOnSale 产品上架
func (t *AgriTrace) PutProductOnSale(ctx contractapi.TransactionContextInterface, productID string) error {
	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	if product.Status != "HARVESTED" && product.Status != "OFF_SHELF" {
		return fmt.Errorf("只有已收获或已下架的产品可以上架，当前状态: %s", product.Status)
	}

	product.Status = "ON_SALE"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// TakeProductOffShelf 产品下架
func (t *AgriTrace) TakeProductOffShelf(ctx contractapi.TransactionContextInterface, productID string) error {
	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	if product.Status != "ON_SALE" && product.Status != "SOLD_OUT" {
		return fmt.Errorf("只有在售或售罄的产品可以下架，当前状态: %s", product.Status)
	}

	product.Status = "OFF_SHELF"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// MarkProductAsSoldOut 标记产品售罄
func (t *AgriTrace) MarkProductAsSoldOut(ctx contractapi.TransactionContextInterface, productID string) error {
	product, err := t.QueryProduct(ctx, productID)
	if err != nil {
		return err
	}

	if product.Status != "ON_SALE" {
		return fmt.Errorf("只有在售的产品可以标记为售罄，当前状态: %s", product.Status)
	}

	product.Status = "SOLD_OUT"
	product.UpdatedAt = time.Now()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(productID, productJSON)
}

// RegisterConsumer 注册消费者
func (t *AgriTrace) RegisterConsumer(ctx contractapi.TransactionContextInterface, consumerData string) error {
	var consumer Consumer
	err := json.Unmarshal([]byte(consumerData), &consumer)
	if err != nil {
		return fmt.Errorf("解析消费者数据失败: %v", err)
	}

	// 检查消费者ID是否已存在
	consumerJSON, err := ctx.GetStub().GetState(consumer.ID)
	if err != nil {
		return err
	}
	if consumerJSON != nil {
		return fmt.Errorf("消费者已存在: %s", consumer.ID)
	}

	// 设置创建时间
	consumer.CreatedAt = time.Now()

	// 将消费者数据序列化并存储
	consumerJSON, err = json.Marshal(consumer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(consumer.ID, consumerJSON)
}

// AddProductFeedback 添加产品反馈
func (t *AgriTrace) AddProductFeedback(ctx contractapi.TransactionContextInterface, feedbackData string) error {
	var feedback ProductFeedback
	err := json.Unmarshal([]byte(feedbackData), &feedback)
	if err != nil {
		return fmt.Errorf("解析反馈数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, feedback.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", feedback.ProductID)
	}

	// 检查消费者是否存在
	consumerJSON, err := ctx.GetStub().GetState(feedback.ConsumerID)
	if err != nil {
		return err
	}
	if consumerJSON == nil {
		return fmt.Errorf("消费者不存在: %s", feedback.ConsumerID)
	}

	// 验证评分范围
	if feedback.Rating < 1 || feedback.Rating > 5 {
		return fmt.Errorf("评分必须在1-5之间")
	}

	// 设置创建时间
	feedback.CreatedAt = time.Now()

	// 将反馈数据序列化并存储
	feedbackJSON, err := json.Marshal(feedback)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(feedback.ID, feedbackJSON)
}

// QueryProductFeedbacks 查询产品的所有反馈
func (t *AgriTrace) QueryProductFeedbacks(ctx contractapi.TransactionContextInterface, productID string) ([]*ProductFeedback, error) {
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, productID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("产品不存在: %s", productID)
	}

	// 获取所有状态
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var feedbacks []*ProductFeedback
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var feedback ProductFeedback
		err = json.Unmarshal(queryResult.Value, &feedback)
		if err != nil {
			continue // 跳过非反馈记录
		}

		// 在内存中过滤指定产品的反馈
		if feedback.ProductID == productID {
			feedbacks = append(feedbacks, &feedback)
		}
	}

	return feedbacks, nil
}

// QueryConsumerFeedbacks 查询消费者的所有反馈
func (t *AgriTrace) QueryConsumerFeedbacks(ctx contractapi.TransactionContextInterface, consumerID string) ([]*ProductFeedback, error) {
	// 检查消费者是否存在
	consumerJSON, err := ctx.GetStub().GetState(consumerID)
	if err != nil {
		return nil, err
	}
	if consumerJSON == nil {
		return nil, fmt.Errorf("消费者不存在: %s", consumerID)
	}

	// 获取所有状态
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var feedbacks []*ProductFeedback
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// 只处理以 FEEDBACK_ 开头的记录
		if !strings.HasPrefix(queryResult.Key, "FEEDBACK_") {
			continue
		}

		var feedback ProductFeedback
		err = json.Unmarshal(queryResult.Value, &feedback)
		if err != nil {
			continue // 跳过非反馈记录
		}

		// 在内存中过滤指定消费者的反馈
		if feedback.ConsumerID == consumerID {
			feedbacks = append(feedbacks, &feedback)
		}
	}

	// 如果没有找到记录，返回空数组而不是 nil
	if feedbacks == nil {
		feedbacks = []*ProductFeedback{}
	}

	// 按创建时间倒序排序
	sort.Slice(feedbacks, func(i, j int) bool {
		return feedbacks[i].CreatedAt.After(feedbacks[j].CreatedAt)
	})

	return feedbacks, nil
}

// QueryProductTrace 查询产品全链路追溯信息
func (t *AgriTrace) QueryProductTrace(ctx contractapi.TransactionContextInterface, productID string) (string, error) {
	// 检查产品是否存在
	productJSON, err := ctx.GetStub().GetState(productID)
	if err != nil {
		return "", err
	}
	if productJSON == nil {
		return "", fmt.Errorf("产品不存在: %s", productID)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return "", err
	}

	// 构建追溯信息结构
	type TraceInfo struct {
		Product           Product            `json:"product"`
		ProductionRecords []*ProductionRecord `json:"productionRecords"`
		QualityRecords    []*QualityRecord   `json:"qualityRecords"`
		LogisticsRecords  []*LogisticsRecord `json:"logisticsRecords"`
		Feedbacks         []*ProductFeedback  `json:"feedbacks"`
	}

	// 获取生产记录
	productionRecords, err := t.QueryProductionRecordsByProduct(ctx, productID)
	if err != nil {
		return "", err
	}

	// 获取质量记录
	qualityRecords, err := t.QueryQualityRecordsByProduct(ctx, productID)
	if err != nil {
		return "", err
	}

	// 获取物流记录
	logisticsRecords, err := t.QueryLogisticsRecordsByProduct(ctx, productID)
	if err != nil {
		return "", err
	}

	// 获取消费者反馈
	feedbacks, err := t.QueryProductFeedbacks(ctx, productID)
	if err != nil {
		return "", err
	}

	// 组装追溯信息
	traceInfo := TraceInfo{
		Product:           product,
		ProductionRecords: productionRecords,
		QualityRecords:    qualityRecords,
		LogisticsRecords:  logisticsRecords,
		Feedbacks:         feedbacks,
	}

	// 序列化为JSON
	traceInfoJSON, err := json.Marshal(traceInfo)
	if err != nil {
		return "", err
	}

	return string(traceInfoJSON), nil
}

// CreatePurchaseCode 生成购买凭证码
func generatePurchaseCode(productID string, consumerID string) string {
	timestamp := time.Now().Unix()
	code := fmt.Sprintf("%s_%s_%d", productID, consumerID, timestamp)
	return code
}

// AddConsumerPurchase 添加消费者购买记录
func (t *AgriTrace) AddConsumerPurchase(ctx contractapi.TransactionContextInterface, purchaseData string) error {
	var purchase ConsumerPurchase
	err := json.Unmarshal([]byte(purchaseData), &purchase)
	if err != nil {
		return fmt.Errorf("解析购买记录数据失败: %v", err)
	}

	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, purchase.ProductID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("产品不存在: %s", purchase.ProductID)
	}

	// 检查消费者是否存在
	consumerJSON, err := ctx.GetStub().GetState(purchase.ConsumerID)
	if err != nil {
		return err
	}
	if consumerJSON == nil {
		return fmt.Errorf("消费者不存在: %s", purchase.ConsumerID)
	}

	// 检查零售商库存
	inventories, err := t.QueryInventoryByRetailer(ctx, purchase.RetailerID)
	if err != nil {
		return err
	}

	var inventory *RetailInventory
	for _, inv := range inventories {
		if inv.ProductID == purchase.ProductID {
			inventory = inv
			break
		}
	}

	if inventory == nil {
		return fmt.Errorf("未找到相关库存记录")
	}

	if inventory.Quantity < purchase.Quantity {
		return fmt.Errorf("库存不足: 当前库存 %d, 需要数量 %d", inventory.Quantity, purchase.Quantity)
	}

	// 生成购买凭证码
	purchase.PurchaseCode = generatePurchaseCode(purchase.ProductID, purchase.ConsumerID)
	
	// 设置购买时间
	purchase.PurchaseTime = time.Now()
	
	// 计算总金额
	purchase.TotalAmount = purchase.UnitPrice * float64(purchase.Quantity)

	// 创建销售记录
	salesRecord := SalesRecord{
		ID:           fmt.Sprintf("SALE_%s", purchase.ID),
		ProductID:    purchase.ProductID,
		RetailerID:   purchase.RetailerID,
		ConsumerID:   purchase.ConsumerID,
		Quantity:     purchase.Quantity,
		UnitPrice:    purchase.UnitPrice,
		TotalAmount:  purchase.TotalAmount,
		SaleTime:     purchase.PurchaseTime,
		PaymentType:  purchase.PaymentType,
		PurchaseCode: purchase.PurchaseCode,
	}

	// 更新库存数量
	err = t.UpdateInventoryQuantity(ctx, inventory.ID, inventory.Quantity-purchase.Quantity)
	if err != nil {
		return err
	}

	// 存储购买记录
	purchaseJSON, err := json.Marshal(purchase)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(purchase.ID, purchaseJSON)
	if err != nil {
		return err
	}

	// 存储销售记录
	salesJSON, err := json.Marshal(salesRecord)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(salesRecord.ID, salesJSON)
	if err != nil {
		return err
	}

	return nil
}

// QueryConsumerPurchases 查询消费者的购买记录
func (t *AgriTrace) QueryConsumerPurchases(ctx contractapi.TransactionContextInterface, consumerID string) ([]*ConsumerPurchase, error) {
	// 检查消费者是否存在
	consumerJSON, err := ctx.GetStub().GetState(consumerID)
	if err != nil {
		return nil, err
	}
	if consumerJSON == nil {
		return nil, fmt.Errorf("消费者不存在: %s", consumerID)
	}

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var purchases []*ConsumerPurchase
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var purchase ConsumerPurchase
		err = json.Unmarshal(queryResult.Value, &purchase)
		if err != nil {
			continue // 跳过非购买记录
		}

		if purchase.ConsumerID == consumerID {
			purchases = append(purchases, &purchase)
		}
	}

	return purchases, nil
}

// VerifyPurchase 验证购买凭证
func (t *AgriTrace) VerifyPurchase(ctx contractapi.TransactionContextInterface, purchaseCode string) (*ConsumerPurchase, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var purchase ConsumerPurchase
		err = json.Unmarshal(queryResult.Value, &purchase)
		if err != nil {
			continue
		}

		if purchase.PurchaseCode == purchaseCode {
			return &purchase, nil
		}
	}

	return nil, fmt.Errorf("未找到对应的购买记录")
}

// QueryProductionRecordsByProduct 查询产品的生产记录
func (t *AgriTrace) QueryProductionRecordsByProduct(ctx contractapi.TransactionContextInterface, productID string) ([]*ProductionRecord, error) {
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, productID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("产品不存在: %s", productID)
	}

	// 获取所有状态
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

		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	return records, nil
}

// QueryQualityRecordsByProduct 查询产品的质量检测记录
func (t *AgriTrace) QueryQualityRecordsByProduct(ctx contractapi.TransactionContextInterface, productID string) ([]*QualityRecord, error) {
	// 检查产品是否存在
	exists, err := t.ProductExists(ctx, productID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("产品不存在: %s", productID)
	}

	// 获取所有状态
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

		if record.ProductID == productID {
			records = append(records, &record)
		}
	}

	// 按阶段和时间排序
	sort.Slice(records, func(i, j int) bool {
		// 首先按阶段排序：HARVESTING > GROWING > PLANTING
		stageOrder := map[string]int{
			"HARVESTING": 3,
			"GROWING":   2,
			"PLANTING":  1,
		}
		if stageOrder[records[i].Stage] != stageOrder[records[j].Stage] {
			return stageOrder[records[i].Stage] > stageOrder[records[j].Stage]
		}
		// 如果阶段相同，则按时间倒序
		return records[i].RecordTime.After(records[j].RecordTime)
	})

	return records, nil
}

// QueryRetailers 查询所有零售商
func (t *AgriTrace) QueryRetailers(ctx contractapi.TransactionContextInterface) ([]*Retailer, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var retailers []*Retailer
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// 跳过带有特定前缀的记录
		if strings.HasPrefix(queryResult.Key, "INV_") ||
		   strings.HasPrefix(queryResult.Key, "SALE_") ||
		   strings.HasPrefix(queryResult.Key, "PRICE_") ||
		   strings.HasPrefix(queryResult.Key, "PURCHASE_") {
			continue
		}

		var retailer Retailer
		err = json.Unmarshal(queryResult.Value, &retailer)
		if err != nil {
			fmt.Printf("Warning: Failed to unmarshal retailer: %v\n", err)
			continue // 跳过无效的零售商记录
		}

		// 只添加有效的零售商记录（必须有name字段）
		if retailer.Name != "" {
			retailers = append(retailers, &retailer)
		}
	}

	// 如果没有找到记录，返回空数组而不是nil
	if retailers == nil {
		retailers = []*Retailer{}
	}

	return retailers, nil
}

// RegisterRetailer 注册零售商
func (t *AgriTrace) RegisterRetailer(ctx contractapi.TransactionContextInterface, retailerData string) error {
	var retailer Retailer
	err := json.Unmarshal([]byte(retailerData), &retailer)
	if err != nil {
		return fmt.Errorf("解析零售商数据失败: %v", err)
	}

	// 如果ID带有RETAILER_前缀，去掉前缀
	if strings.HasPrefix(retailer.ID, "RETAILER_") {
		retailer.ID = strings.TrimPrefix(retailer.ID, "RETAILER_")
	}

	// 检查ID是否已存在
	retailerJSON, err := ctx.GetStub().GetState(retailer.ID)
	if err != nil {
		return err
	}
	if retailerJSON != nil {
		return fmt.Errorf("零售商已存在: %s", retailer.ID)
	}

	// 设置创建时间
	retailer.CreatedAt = time.Now()

	// 将零售商数据序列化并存储
	retailerJSON, err = json.Marshal(retailer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(retailer.ID, retailerJSON)
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