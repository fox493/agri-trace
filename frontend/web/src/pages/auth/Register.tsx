import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/auth';
import { User } from '../../types';
import './Auth.css';

const { Title } = Typography;
const { Option } = Select;

interface RegisterFormValues {
    username: string;
    password: string;
    role: User['role'];
}

const Register: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [form] = Form.useForm<RegisterFormValues>();

    const onFinish = async (values: RegisterFormValues) => {
        try {
            setLoading(true);
            const response = await register({
                username: values.username,
                password: values.password,
                role: values.role
            });

            if (response.success) {
                message.success('注册成功！');
                navigate('/');
            } else {
                message.error(response.error || '注册失败');
            }
        } catch (error) {
            message.error('注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card">
                <div className="auth-header">
                    <Title level={2}>注册</Title>
                </div>
                <Form<RegisterFormValues>
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="请输入用户名"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少6个字符' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="请输入密码"
                        />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                    >
                        <Select
                            placeholder="请选择角色"
                            suffixIcon={<TeamOutlined />}
                        >
                            <Option value="farmer">农户</Option>
                            <Option value="inspector">检测员</Option>
                            <Option value="logistics">物流人员</Option>
                            <Option value="retailer">零售商</Option>
                            <Option value="consumer">消费者</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            注册
                        </Button>
                    </Form.Item>

                    <div className="auth-footer">
                        已有账号？
                        <Link to="/login">立即登录</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register; 