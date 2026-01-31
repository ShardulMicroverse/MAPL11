import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken }
          )

          const { token, refreshToken: newRefreshToken } = res.data.data

          localStorage.setItem('token', token)
          localStorage.setItem('refreshToken', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(
      new Error(error.response?.data?.message || 'An error occurred')
    )
  }
)

export default api
