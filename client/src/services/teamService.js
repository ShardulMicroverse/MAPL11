import api from './api'

export const teamService = {
  async joinQueue(matchId) {
    return api.post(`/teams/${matchId}/join`)
  },

  async getQueueStatus(matchId) {
    return api.get(`/teams/${matchId}/status`)
  },

  async getMyTeam(matchId) {
    return api.get(`/teams/${matchId}/my-team`)
  },

  async leaveQueue(matchId) {
    return api.delete(`/teams/${matchId}/leave`)
  }
}
