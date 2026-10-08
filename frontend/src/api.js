const BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('campos_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  // Return json if available
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return res;
}

export const api = {
  // Authentication
  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      localStorage.setItem('campos_token', data.access_token);
      localStorage.setItem('campos_user', JSON.stringify(data.user));
    }
    return data;
  },

  async demoSwitch(role, userId = null) {
    const data = await request('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role, user_id: userId }),
    });
    if (data.access_token) {
      localStorage.setItem('campos_token', data.access_token);
      localStorage.setItem('campos_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getDemoAccounts() {
    return await request('/api/auth/demo-accounts');
  },

  async getMe() {
    return await request('/api/auth/me');
  },

  logout() {
    localStorage.removeItem('campos_token');
    localStorage.removeItem('campos_user');
  },

  // Unified Requests Desk
  async getRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'All') params.append('type', filters.type);
    if (filters.hostel && filters.hostel !== 'All') params.append('hostel', filters.hostel);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.escalated !== undefined) params.append('escalated', filters.escalated);
    if (filters.community !== undefined) params.append('community', filters.community);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await request(`/api/requests${query}`);
  },

  async createRequest(reqData) {
    return await request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(reqData),
    });
  },

  async getRequestDetail(id) {
    return await request(`/api/requests/${id}`);
  },

  async updateRequestStatus(id, newStatus, note = '', actorName = '', resolutionProof = '', proofImageUrl = '', vendorSlip = '') {
    return await request(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        note,
        actor_name: actorName,
        resolution_proof: resolutionProof,
        action_taken_notes: resolutionProof,
        proof_image_url: proofImageUrl,
        vendor_invoice_or_slip: vendorSlip,
      }),
    });
  },

  async upvoteRequest(id) {
    return await request(`/api/requests/${id}/upvote`, { method: 'POST' });
  },

  async verifyRequest(id, confirmed, note = '') {
    return await request(`/api/requests/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ confirmed, note }),
    });
  },

  async getRequestLogs(id) {
    return await request(`/api/requests/${id}/logs`);
  },

  async getSimilarTickets(type, category) {
    const params = new URLSearchParams({ type, category });
    return await request(`/api/requests/similar?${params.toString()}`);
  },

  getQrUrl(id) {
    return `${BASE_URL}/api/requests/${id}/qr`;
  },

  async triggerEscalationCheck() {
    return await request('/api/requests/escalate-check', { method: 'POST' });
  },

  // Targeted Notices
  async getNotices() {
    return await request('/api/notices');
  },

  async createNotice(noticeData) {
    return await request('/api/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData),
    });
  },

  async markNoticeRead(id) {
    return await request(`/api/notices/${id}/read`, { method: 'POST' });
  },

  async markNoticeAction(id) {
    return await request(`/api/notices/${id}/action`, { method: 'POST' });
  },

  // Student Features
  async getStudentAttendance() {
    return await request('/api/student/attendance');
  },

  async getStudentTimetable() {
    return await request('/api/student/timetable');
  },

  async getStudentFees() {
    return await request('/api/student/fees');
  },

  async getMessMenu() {
    return await request('/api/student/mess-menu');
  },

  async submitMessFeedback(data) {
    return await request('/api/student/mess-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyMessFeedback() {
    return await request('/api/student/mess-feedback');
  },

  async getMyGateHistory() {
    return await request('/api/student/gate-history');
  },

  // Admin & Warden Features
  async getAdminDashboard() {
    return await request('/api/admin/dashboard');
  },

  async getRepeatIssues() {
    return await request('/api/admin/repeat-issues');
  },

  async getRooms() {
    return await request('/api/admin/rooms');
  },

  async createRoom(data) {
    return await request('/api/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getGateLogs() {
    return await request('/api/admin/gate-logs');
  },

  async createGateLog(data) {
    return await request('/api/admin/gate-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdminMessFeedback() {
    return await request('/api/admin/mess-feedback');
  },

  async resetDemoData() {
    return await request('/api/admin/reset-demo', { method: 'POST' });
  },
};
