(() => {
  const testUser = {
    id: 902,
    firstName: "Robot",
    lastName: "Test",
    phoneNumber: "0812345678",
    email: "robot-test@example.invalid",
    gender: "male",
    profileImage: "",
    role: "user",
    hasPassword: true,
  };

  localStorage.setItem("token", "robot-test-session");
  localStorage.setItem("user", JSON.stringify(testUser));
  window.__us09Requests = [];
  window.__us09ResponseStatus = 200;

  const mockProfile = (url, method, body) => {
    if (url.pathname.endsWith("/auth/me") && method === "GET") {
      return {
        status: 200,
        data: { user: JSON.parse(localStorage.getItem("user") || "{}") },
      };
    }

    if (!url.pathname.endsWith("/users/profile") || !["PUT", "PATCH"].includes(method)) {
      return null;
    }

    const submittedValues = {};
    let hasProfileImage = false;
    if (body instanceof FormData) {
      body.forEach((value, key) => {
        if (key === "profileImage") hasProfileImage = true;
        else if (typeof value === "string") submittedValues[key] = value;
      });
    }

    window.__us09Requests.push({ method, submittedValues, hasProfileImage });
    if (window.__us09ResponseStatus !== 200) {
      return {
        status: window.__us09ResponseStatus,
        data: { message: "เกิดข้อผิดพลาดในระบบ" },
      };
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = {
      ...user,
      ...submittedValues,
      ...(hasProfileImage ? { profileImage: "https://example.com/profile.png" } : {}),
    };
    return {
      status: 200,
      data: { message: "อัปเดตโปรไฟล์สำเร็จ", user: updatedUser },
    };
  };

  const originalFetch = window.fetch.bind(window);
  const respond = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    const method = (init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const body = init.body || (input instanceof Request ? await input.clone().formData() : null);
    const mocked = mockProfile(url, method, body);
    if (mocked) return respond(mocked.data, mocked.status);
    return originalFetch(input, init);
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this.__us09Request = { url: new URL(url, location.href), method: method.toUpperCase() };
    const path = this.__us09Request.url.pathname;
    this.__us09Mocked = (path.endsWith("/auth/me") && this.__us09Request.method === "GET")
      || (path.endsWith("/users/profile") && ["PUT", "PATCH"].includes(this.__us09Request.method));
    originalXhrOpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (!this.__us09Mocked) return originalXhrSend.call(this, body);

    const mocked = mockProfile(this.__us09Request.url, this.__us09Request.method, body);
    const text = JSON.stringify(mocked.data);
    Object.defineProperties(this, {
      readyState: { configurable: true, value: 4 },
      status: { configurable: true, value: mocked.status },
      statusText: { configurable: true, value: mocked.status === 200 ? "OK" : "Internal Server Error" },
      responseURL: { configurable: true, value: this.__us09Request.url.href },
      responseText: { configurable: true, get: () => text },
      response: { configurable: true, get: () => this.responseType === "json" ? JSON.parse(text) : text },
    });
    this.getAllResponseHeaders = () => "content-type: application/json\\r\\n";
    this.getResponseHeader = (name) => name.toLowerCase() === "content-type" ? "application/json" : null;
    queueMicrotask(() => {
      this.dispatchEvent(new Event("readystatechange"));
      this.dispatchEvent(new ProgressEvent("load"));
      this.dispatchEvent(new ProgressEvent("loadend"));
    });
  };
})();
