// --------------------------------------------------------------------------
// 1. 定义接口的参数类型
// --------------------------------------------------------------------------

/**
 * 用户信息
 */
export interface User {
    nickname: string;
    name?: string;        // 可选
    email?: string;       // 可选
    avatar?: string;
    role?: string;        // 可选
    createdAt?: string;   // 可选
    updatedAt?: string;   // 可选
}

/**
 * 登录参数
 */
export interface LoginParams {
    email: string;
    password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
    accessToken: string;         // 访问 Token
    refreshToken: string;  // 刷新 Token
    user: User;           // 用户信息
}

/**
 * 注册参数
 */
export interface RegisterParams {
    username: string;
    password: string;
    email: string;
    name?: string;
    code: string;  // 邮箱验证码
}

/**
 * 注册响应   后续注册完可以弄成直接登录
 */
export interface RegisterResponse {
    email: string;
    message: string;
}


/**
 * 发送注册验证码参数
 */
export interface SendRegisterCodeParams {
    email: string;
}

/**
 * 发送重置密码验证码参数
 */
export interface SendResetPasswordCodeParams {
    email: string;
}

/**
 * 重置密码参数
 */
export interface ResetPasswordParams {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;

}

/**
 * 修改密码参数
 */
export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * 刷新 Token 参数
 */
export interface RefreshTokenParams {
    refreshToken: string;
}

/**
 * 刷新 Token 响应
 */
export interface RefreshTokenResponse {
    token: string;         // 新的访问 Token
    refreshToken: string;  // 新的刷新 Token
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
    page?: number;      // 页码（从 1 开始）
    pageSize?: number;  // 每页数量
    keyword?: string;   // 搜索关键词
    role?: string;      // 角色筛选
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
    total: number;   // 总数
    list: User[];    // 用户列表
}