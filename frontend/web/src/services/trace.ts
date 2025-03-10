import { request } from './request';
import {
  TRACE_PRODUCT_API,
  TRACE_HISTORY_API,
  TRACE_CERTIFICATIONS_API,
  TRACE_ENVIRONMENT_API,
  TRACE_INVENTORY_API,
  VERIFY_PRODUCT_API
} from './api';

/**
 * 获取产品完整溯源信息
 * @param productId 产品ID
 * @returns 产品溯源数据
 */
export const getProductTrace = async (productId: string) => {
  return request(`${TRACE_PRODUCT_API}/${productId}`);
};

/**
 * 获取产品历史记录
 * @param productId 产品ID
 * @returns 产品历史变更记录
 */
export const getProductHistory = async (productId: string) => {
  return request(`${TRACE_HISTORY_API}/${productId}`);
};

/**
 * 获取产品认证信息
 * @param productId 产品ID
 * @returns 产品认证数据
 */
export const getProductCertifications = async (productId: string) => {
  return request(`${TRACE_CERTIFICATIONS_API}/${productId}`);
};

/**
 * 获取产品环境数据
 * @param productId 产品ID
 * @returns 产品环境监测数据
 */
export const getProductEnvironmentData = async (productId: string) => {
  return request(`${TRACE_ENVIRONMENT_API}/${productId}`);
};

/**
 * 获取产品库存信息
 * @param productId 产品ID
 * @returns 产品库存数据
 */
export const getProductInventory = async (productId: string) => {
  return request(`${TRACE_INVENTORY_API}?productId=${productId}`);
};

/**
 * 验证产品真实性
 * @param productId 产品ID
 * @returns 验证结果
 */
export const verifyProduct = async (productId: string) => {
  return request(`${VERIFY_PRODUCT_API}/${productId}`, { method: 'POST' });
};

/**
 * 通过溯源码查询产品
 * @param traceCode 溯源码
 * @returns 产品数据
 */
export const getProductByTraceCode = async (traceCode: string) => {
  return request(`/api/products/traceCode/${traceCode}`);
}; 