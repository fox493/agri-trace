package main

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockStub struct {
	mock.Mock
	shim.ChaincodeStubInterface
}

func (ms *MockStub) GetStateByRange(startKey string, endKey string) (shim.StateQueryIteratorInterface, error) {
	args := ms.Called(startKey, endKey)
	return args.Get(0).(shim.StateQueryIteratorInterface), args.Error(1)
}

func (ms *MockStub) PutState(key string, value []byte) error {
	args := ms.Called(key, value)
	return args.Error(0)
}

func (ms *MockStub) GetState(key string) ([]byte, error) {
	args := ms.Called(key)
	return args.Get(0).([]byte), args.Error(1)
}

type MockContext struct {
	mock.Mock
	contractapi.TransactionContextInterface
	stub *MockStub
}

func (mc *MockContext) GetStub() shim.ChaincodeStubInterface {
	return mc.stub
}

type MockKeyValue struct {
	Key   string
	Value []byte
}

type MockIterator struct {
	mock.Mock
	items   [][]byte
	current int
}

func (mi *MockIterator) HasNext() bool {
	return mi.current < len(mi.items)
}

func (mi *MockIterator) Next() (*shim.QueryResponse, error) {
	if !mi.HasNext() {
		return nil, fmt.Errorf("no more items")
	}
	item := mi.items[mi.current]
	mi.current++
	return &shim.QueryResponse{
		Key:    fmt.Sprintf("key%d", mi.current),
		Value:  item,
	}, nil
}

func (mi *MockIterator) Close() error {
	mi.current = len(mi.items)
	return nil
}

func TestQueryProductsByFarmer(t *testing.T) {
	// 创建测试数据
	products := []Product{
		{
			ID:           "product1",
			Name:         "玉米",
			FarmerID:     "farmer1",
			Status:       "PLANTING",
		},
		{
			ID:           "product2",
			Name:         "水稻",
			FarmerID:     "farmer1",
			Status:       "HARVESTED",
		},
		{
			ID:           "product3",
			Name:         "小麦",
			FarmerID:     "farmer2",
			Status:       "PLANTING",
		},
	}

	// 序列化测试数据
	var productBytes [][]byte
	for _, p := range products {
		bytes, err := json.Marshal(p)
		assert.NoError(t, err)
		productBytes = append(productBytes, bytes)
	}

	// 创建 mock 对象
	mockStub := new(MockStub)
	mockCtx := &MockContext{stub: mockStub}
	mockIterator := &MockIterator{items: productBytes}

	// 设置 mock 行为
	mockStub.On("GetStateByRange", "", "").Return(mockIterator, nil)

	// 创建合约实例
	contract := new(AgriTrace)

	// 测试查询 farmer1 的产品
	result, err := contract.QueryProductsByFarmer(mockCtx, "farmer1")
	assert.NoError(t, err)

	// 解析结果
	var resultProducts []*Product
	err = json.Unmarshal([]byte(result), &resultProducts)
	assert.NoError(t, err)

	// 验证结果
	assert.Equal(t, 2, len(resultProducts))
	assert.Equal(t, "farmer1", resultProducts[0].FarmerID)
	assert.Equal(t, "farmer1", resultProducts[1].FarmerID)
} 