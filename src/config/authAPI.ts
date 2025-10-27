import api from "./api";

export const authAPI = {
  // Đăng ký
  signUp: async (data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    gender?: string;
    dateOfBirth?: string;
    avatar?: string;
    address?: {
      fullAddress?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
    };
    termsAgreed: boolean;
  }) => {
    const response = await api.post("/users/signup", data);
    return response.data;
  },

  // Đăng nhập
  signIn: async (data: { email: string; password: string }) => {
    const response = await api.post("/users/signin", data);
    return response.data;
  },
};