const API_BASE = "/api";

const Api = {
  async request(path, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${path}`, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      console.warn("API fallback to mock data:", error.message);
      return null;
    }
  },

  async uploadReport(formData) {
    return this.request("/upload", {
      method: "POST",
      body: formData
    });
  },

  async askQuestion(docId, question) {
    return this.request(`/doc/${docId}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
  },

  async saveStructure(docId, payload) {
    return this.request(`/doc/${docId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
};
