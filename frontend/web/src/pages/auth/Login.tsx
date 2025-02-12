import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/auth';
import './Auth.css';

const { Title } = Typography;

interface LoginFormValues {
    username: string;
    password: string;
}

const Login: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const onFinish = async (values: LoginFormValues) => {
        try {
            setLoading(true);
            const result = await login(values.username, values.password);
            
            if (result.success) {
                message.success('登录成功！');
                navigate('/');
            } else {
                // 设置表单字段错误
                form.setFields([
                    {
                        name: 'password',
                        errors: [result.error || '登录失败']
                    }
                ]);
            }
        } catch (error: any) {
            message.error('登录失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card">
                <div className="auth-header">
                    <Title level={2}>登录</Title>
                </div>
                <Form<LoginFormValues>
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: '请输入用户名',
                            },
                            {
                                min: 3,
                                message: '用户名至少3个字符',
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="用户名"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: '请输入密码',
                            },
                            {
                                min: 6,
                                message: '密码至少6个字符',
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="密码"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            登录
                        </Button>
                    </Form.Item>

                    <div className="auth-footer">
                        还没有账号？
                        <Link to="/register">立即注册</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login; 