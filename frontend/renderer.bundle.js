var App = (() => {
  // src/renderer.js
  var { useState, useEffect, useRef } = React;
  var { HashRouter, Routes, Route, Link, useNavigate, useLocation } = ReactRouterDOM;
  var API_URL_KEY = "server_url";
  var TOKEN_KEY = "auth_token";
  var USER_KEY = "user_data";
  var apiClient = {
    async request(path, options = {}) {
      const baseUrl = localStorage.getItem(API_URL_KEY) || "";
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = { "Content-Type": "application/json", ...options.headers };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(baseUrl + path, { ...options, headers });
      if (!res.ok) throw new Error((await res.json()).error || "Request failed");
      return res.json();
    }
  };
  function Login() {
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [serverUrl, setServerUrl] = useState(localStorage.getItem(API_URL_KEY) || window.location.origin);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleLogin = async () => {
      setError("");
      setLoading(true);
      try {
        localStorage.setItem(API_URL_KEY, serverUrl);
        const data = await apiClient.request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password })
        });
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        window.location.reload();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      handleLogin();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "login-page" }, /* @__PURE__ */ React.createElement("form", { className: "login-card", onSubmit: handleSubmit }, /* @__PURE__ */ React.createElement("img", { src: "logo.png", alt: "Sree Swamys" }), /* @__PURE__ */ React.createElement("h1", null, "Sree Swamys Tractors"), /* @__PURE__ */ React.createElement("p", null, "Inventory Management System"), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Server URL"), /* @__PURE__ */ React.createElement("input", { value: serverUrl, onChange: (e) => setServerUrl(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Username"), /* @__PURE__ */ React.createElement("input", { value: username, onChange: (e) => setUsername(e.target.value), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Password"), /* @__PURE__ */ React.createElement("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true })), error && /* @__PURE__ */ React.createElement("p", { style: { color: "red", fontSize: 13, marginBottom: 10 } }, error), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { width: "100%" }, disabled: loading }, loading ? "Logging in..." : "Login")));
  }
  function Layout({ children }) {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
    const navigate = useNavigate();
    const location = useLocation();
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
      window.addEventListener("online", () => setOnline(true));
      window.addEventListener("offline", () => setOnline(false));
    }, []);
    const nav = [
      { path: "/dashboard", icon: "\u{1F4CA}", label: "Dashboard" },
      { path: "/tractors", icon: "\u{1F69C}", label: "Tractors" },
      { path: "/spares", icon: "\u{1F527}", label: "Spare Parts" },
      { path: "/customers", icon: "\u{1F465}", label: "Customers" },
      { path: "/sales", icon: "\u{1F4B0}", label: "Sales" },
      { path: "/jobcards", icon: "\u{1F6E0}\uFE0F", label: "Job Cards" },
      { path: "/staff", icon: "\u{1F468}\u200D\u{1F4BC}", label: "Staff" },
      { path: "/salary", icon: "\u{1F4B5}", label: "Salary" },
      { path: "/reports", icon: "\u{1F4C8}", label: "Reports" },
      { path: "/settings", icon: "\u2699\uFE0F", label: "Settings" }
    ];
    const logout = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.reload();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("div", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "sidebar-header" }, /* @__PURE__ */ React.createElement("img", { src: "logo.png", alt: "logo" }), /* @__PURE__ */ React.createElement("h2", null, "Sree Swamys Tractors"), /* @__PURE__ */ React.createElement("p", null, user.full_name || user.username)), nav.map((n) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: n.path,
        className: `nav-item ${location.pathname === n.path ? "active" : ""}`,
        onClick: () => navigate(n.path)
      },
      /* @__PURE__ */ React.createElement("span", null, n.icon),
      " ",
      n.label
    )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "auto", padding: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger", style: { width: "100%" }, onClick: logout }, "Logout"))), /* @__PURE__ */ React.createElement("div", { className: "main" }, /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("h1", null, nav.find((n) => n.path === location.pathname)?.label || "Sree Swamys"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `online-indicator ${online ? "online" : "offline"}` }), online ? "Online" : "Offline (using cached data)")), /* @__PURE__ */ React.createElement("div", { className: "content" }, children)));
  }
  function Dashboard() {
    const [data, setData] = useState({ stock: 0, todaySales: 0, lowStock: [], pending: 0 });
    useEffect(() => {
      loadData();
    }, []);
    const loadData = async () => {
      try {
        const [tractors, sales, spares, jobs] = await Promise.all([
          apiClient.request("/api/tractors"),
          apiClient.request("/api/sales"),
          apiClient.request("/api/spares"),
          apiClient.request("/api/jobcards")
        ]);
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const inStock = tractors.filter((t) => t.status === "in_stock").length;
        const todaySales = sales.filter((s) => new Date(s.sale_date).toDateString() === today).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        const lowStock = spares.filter((s) => s.stock_qty <= s.reorder_level);
        const pending = jobs.filter((j) => ["open", "assigned", "in_progress"].includes(j.status)).length;
        setData({ stock: inStock, todaySales, lowStock, pending });
      } catch (e) {
        console.error(e);
      }
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "grid-4" }, /* @__PURE__ */ React.createElement("div", { className: "dashboard-card" }, /* @__PURE__ */ React.createElement("h3", null, "\u{1F69C} Tractors in Stock"), /* @__PURE__ */ React.createElement("div", { className: "value" }, data.stock)), /* @__PURE__ */ React.createElement("div", { className: "dashboard-card" }, /* @__PURE__ */ React.createElement("h3", null, "\u{1F4B0} Today's Sales"), /* @__PURE__ */ React.createElement("div", { className: "value" }, "\u20B9", data.todaySales.toFixed(0))), /* @__PURE__ */ React.createElement("div", { className: "dashboard-card" }, /* @__PURE__ */ React.createElement("h3", null, "\u{1F527} Low Stock Items"), /* @__PURE__ */ React.createElement("div", { className: "value", style: { color: data.lowStock.length ? "var(--danger)" : "inherit" } }, data.lowStock.length)), /* @__PURE__ */ React.createElement("div", { className: "dashboard-card" }, /* @__PURE__ */ React.createElement("h3", null, "\u{1F6E0}\uFE0F Pending Jobs"), /* @__PURE__ */ React.createElement("div", { className: "value" }, data.pending))), /* @__PURE__ */ React.createElement("div", { className: "card mt-16" }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: 12 } }, "Low Stock Alerts"), data.lowStock.length === 0 ? /* @__PURE__ */ React.createElement("p", null, "All stock levels are good") : /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Part Name"), /* @__PURE__ */ React.createElement("th", null, "Stock"), /* @__PURE__ */ React.createElement("th", null, "Reorder Level"))), /* @__PURE__ */ React.createElement("tbody", null, data.lowStock.map((s) => /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", null, s.name), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-danger" }, s.stock_qty)), /* @__PURE__ */ React.createElement("td", null, s.reorder_level)))))));
  }
  function Tractors() {
    const [list, setList] = useState([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({});
    useEffect(() => {
      load();
    }, []);
    const load = async () => {
      try {
        setList(await apiClient.request("/api/tractors"));
      } catch (e) {
        console.error(e);
      }
    };
    const save = async () => {
      try {
        await apiClient.request("/api/tractors", { method: "POST", body: JSON.stringify(form) });
        setShow(false);
        setForm({});
        load();
      } catch (e) {
        alert(e.message);
      }
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex gap-8 mb-16" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setShow(true) }, "+ Add Tractor"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: load }, "\u{1F504} Refresh")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Brand"), /* @__PURE__ */ React.createElement("th", null, "Model"), /* @__PURE__ */ React.createElement("th", null, "HP"), /* @__PURE__ */ React.createElement("th", null, "Chassis"), /* @__PURE__ */ React.createElement("th", null, "Purchase \u20B9"), /* @__PURE__ */ React.createElement("th", null, "Selling \u20B9"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((t) => /* @__PURE__ */ React.createElement("tr", { key: t.id }, /* @__PURE__ */ React.createElement("td", null, t.brand), /* @__PURE__ */ React.createElement("td", null, t.model), /* @__PURE__ */ React.createElement("td", null, t.hp), /* @__PURE__ */ React.createElement("td", null, t.chassis_no), /* @__PURE__ */ React.createElement("td", null, "\u20B9", t.purchase_price), /* @__PURE__ */ React.createElement("td", null, "\u20B9", t.selling_price), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-success" }, t.status))))))), show && /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: () => setShow(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("h2", null, "Add Tractor"), /* @__PURE__ */ React.createElement("div", { className: "grid-2" }, ["brand", "model", "hp", "chassis_no", "engine_no", "color", "year", "purchase_price", "selling_price"].map((f) => /* @__PURE__ */ React.createElement("div", { className: "form-group", key: f }, /* @__PURE__ */ React.createElement("label", null, f.replace("_", " ").toUpperCase()), /* @__PURE__ */ React.createElement("input", { onChange: (e) => setForm({ ...form, [f]: e.target.value }) })))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Acquisition Type"), /* @__PURE__ */ React.createElement("select", { onChange: (e) => setForm({ ...form, acquisition_type: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "purchase" }, "Purchase"), /* @__PURE__ */ React.createElement("option", { value: "exchange" }, "Exchange"))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-8", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: () => setShow(false) }, "Cancel")))));
  }
  function Spares() {
    const [list, setList] = useState([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({});
    useEffect(() => {
      load();
    }, []);
    const load = async () => {
      try {
        setList(await apiClient.request("/api/spares"));
      } catch (e) {
        console.error(e);
      }
    };
    const save = async () => {
      try {
        await apiClient.request("/api/spares", { method: "POST", body: JSON.stringify({ ...form, stock_qty: parseInt(form.stock_qty) || 0 }) });
        setShow(false);
        setForm({});
        load();
      } catch (e) {
        alert(e.message);
      }
    };
    const exportCSV = () => {
      const csv = [
        ["Name", "Part Number", "Brand", "Category", "HSN", "Purchase", "Selling", "Stock", "Reorder"],
        ...list.map((s) => [s.name, s.part_number, s.brand, s.category, s.hsn_code, s.purchase_price, s.selling_price, s.stock_qty, s.reorder_level])
      ].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spares.csv";
      a.click();
    };
    const importCSV = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rows = ev.target.result.split("\n").slice(1);
        for (const row of rows) {
          if (!row.trim()) continue;
          const [name, part_number, brand, category, hsn_code, purchase_price, selling_price, stock_qty, reorder_level] = row.split(",");
          try {
            await apiClient.request("/api/spares", { method: "POST", body: JSON.stringify({
              name,
              part_number,
              brand,
              category,
              hsn_code,
              purchase_price,
              selling_price,
              stock_qty: parseInt(stock_qty) || 0,
              reorder_level: parseInt(reorder_level) || 5
            }) });
          } catch (e2) {
            console.error(e2);
          }
        }
        load();
      };
      reader.readAsText(file);
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex gap-8 mb-16" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setShow(true) }, "+ Add Spare"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: exportCSV }, "\u{1F4E5} Export CSV"), /* @__PURE__ */ React.createElement("label", { className: "btn btn-secondary" }, "\u{1F4E4} Import CSV", /* @__PURE__ */ React.createElement("input", { type: "file", accept: ".csv", style: { display: "none" }, onChange: importCSV }))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Part No"), /* @__PURE__ */ React.createElement("th", null, "Brand"), /* @__PURE__ */ React.createElement("th", null, "Stock"), /* @__PURE__ */ React.createElement("th", null, "Purchase \u20B9"), /* @__PURE__ */ React.createElement("th", null, "Selling \u20B9"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((s) => /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", null, s.name), /* @__PURE__ */ React.createElement("td", null, s.part_number), /* @__PURE__ */ React.createElement("td", null, s.brand), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${s.stock_qty <= s.reorder_level ? "badge-danger" : "badge-success"}` }, s.stock_qty)), /* @__PURE__ */ React.createElement("td", null, "\u20B9", s.purchase_price), /* @__PURE__ */ React.createElement("td", null, "\u20B9", s.selling_price)))))), show && /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: () => setShow(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("h2", null, "Add Spare Part"), /* @__PURE__ */ React.createElement("div", { className: "grid-2" }, ["name", "part_number", "brand", "category", "hsn_code", "purchase_price", "selling_price", "stock_qty", "reorder_level", "supplier", "location"].map((f) => /* @__PURE__ */ React.createElement("div", { className: "form-group", key: f }, /* @__PURE__ */ React.createElement("label", null, f.replace("_", " ").toUpperCase()), /* @__PURE__ */ React.createElement("input", { onChange: (e) => setForm({ ...form, [f]: e.target.value }) })))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-8", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: () => setShow(false) }, "Cancel")))));
  }
  function Customers() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({});
    useEffect(() => {
      apiClient.request("/api/customers").then(setList).catch(console.error);
    }, []);
    const save = async () => {
      await apiClient.request("/api/customers", { method: "POST", body: JSON.stringify(form) });
      setList(await apiClient.request("/api/customers"));
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Add Customer"), /* @__PURE__ */ React.createElement("div", { className: "grid-3" }, ["name", "phone", "address", "aadhaar", "pan"].map((f) => /* @__PURE__ */ React.createElement("div", { className: "form-group", key: f }, /* @__PURE__ */ React.createElement("label", null, f.toUpperCase()), /* @__PURE__ */ React.createElement("input", { onChange: (e) => setForm({ ...form, [f]: e.target.value }) })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary mt-16", onClick: save }, "Save Customer")), /* @__PURE__ */ React.createElement("div", { className: "card mt-16" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Phone"), /* @__PURE__ */ React.createElement("th", null, "Address"), /* @__PURE__ */ React.createElement("th", null, "Aadhaar"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.id }, /* @__PURE__ */ React.createElement("td", null, c.name), /* @__PURE__ */ React.createElement("td", null, c.phone), /* @__PURE__ */ React.createElement("td", null, c.address), /* @__PURE__ */ React.createElement("td", null, c.aadhaar)))))));
  }
  function Sales() {
    const [list, setList] = useState([]);
    useEffect(() => {
      apiClient.request("/api/sales").then(setList).catch(console.error);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Sales History"), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Payment"), /* @__PURE__ */ React.createElement("th", null, "Amount"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((s) => /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", null, new Date(s.sale_date).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", null, "Customer #", s.customer_id), /* @__PURE__ */ React.createElement("td", null, s.payment_mode), /* @__PURE__ */ React.createElement("td", null, "\u20B9", s.total_amount))))));
  }
  function JobCards() {
    const [list, setList] = useState([]);
    useEffect(() => {
      apiClient.request("/api/jobcards").then(setList).catch(console.error);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Job Cards"), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Complaint"), /* @__PURE__ */ React.createElement("th", null, "Total"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((j) => /* @__PURE__ */ React.createElement("tr", { key: j.id }, /* @__PURE__ */ React.createElement("td", null, new Date(j.created_at).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", null, j.complaint?.substring(0, 50)), /* @__PURE__ */ React.createElement("td", null, "\u20B9", j.total_amount), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-warning" }, j.status)))))));
  }
  function Staff() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({});
    useEffect(() => {
      apiClient.request("/api/staff").then(setList).catch(console.error);
    }, []);
    const save = async () => {
      await apiClient.request("/api/staff", { method: "POST", body: JSON.stringify({ ...form, salary: parseFloat(form.salary) || 0 }) });
      setList(await apiClient.request("/api/staff"));
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Add Staff"), /* @__PURE__ */ React.createElement("div", { className: "grid-3" }, ["name", "phone", "role", "salary", "join_date", "address", "aadhaar"].map((f) => /* @__PURE__ */ React.createElement("div", { className: "form-group", key: f }, /* @__PURE__ */ React.createElement("label", null, f.toUpperCase()), /* @__PURE__ */ React.createElement("input", { onChange: (e) => setForm({ ...form, [f]: e.target.value }) })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary mt-16", onClick: save }, "Save Staff")), /* @__PURE__ */ React.createElement("div", { className: "card mt-16" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Role"), /* @__PURE__ */ React.createElement("th", null, "Phone"), /* @__PURE__ */ React.createElement("th", null, "Salary"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((s) => /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", null, s.name), /* @__PURE__ */ React.createElement("td", null, s.role), /* @__PURE__ */ React.createElement("td", null, s.phone), /* @__PURE__ */ React.createElement("td", null, "\u20B9", s.salary)))))));
  }
  function Salary() {
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Salary Management"), /* @__PURE__ */ React.createElement("p", null, "Generate payslips, track advances, monthly salary records."));
  }
  function Reports() {
    const [daily, setDaily] = useState([]);
    const [pending, setPending] = useState([]);
    const [profit, setProfit] = useState([]);
    useEffect(() => {
      const today = /* @__PURE__ */ new Date();
      const last30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const from = last30.toISOString().split("T")[0];
      const to = today.toISOString().split("T")[0];
      apiClient.request(`/api/reports/daily-sales?from=${from}&to=${to}`).then(setDaily).catch(console.error);
      apiClient.request("/api/reports/pending").then(setPending).catch(console.error);
      apiClient.request("/api/reports/profit").then(setProfit).catch(console.error);
    }, []);
    const exportExcel = (data, name) => {
      const csv = data.map((r) => Object.values(r).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "flex", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h3", null, "Daily Sales (Last 30 days)"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: () => exportExcel(daily, "daily-sales.csv") }, "Export")), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Count"), /* @__PURE__ */ React.createElement("th", null, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, daily.map((d, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, d.date), /* @__PURE__ */ React.createElement("td", null, d.count), /* @__PURE__ */ React.createElement("td", null, "\u20B9", d.total)))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Pending Payments"), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Mode"), /* @__PURE__ */ React.createElement("th", null, "Amount"))), /* @__PURE__ */ React.createElement("tbody", null, pending.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id }, /* @__PURE__ */ React.createElement("td", null, new Date(p.sale_date).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", null, p.customer), /* @__PURE__ */ React.createElement("td", null, p.payment_mode), /* @__PURE__ */ React.createElement("td", null, "\u20B9", p.total_amount)))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Profit Report"), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Brand"), /* @__PURE__ */ React.createElement("th", null, "Model"), /* @__PURE__ */ React.createElement("th", null, "Purchase"), /* @__PURE__ */ React.createElement("th", null, "Selling"), /* @__PURE__ */ React.createElement("th", null, "Profit"))), /* @__PURE__ */ React.createElement("tbody", null, profit.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, p.brand), /* @__PURE__ */ React.createElement("td", null, p.model), /* @__PURE__ */ React.createElement("td", null, "\u20B9", p.purchase_price), /* @__PURE__ */ React.createElement("td", null, "\u20B9", p.selling_price), /* @__PURE__ */ React.createElement("td", { style: { color: "green", fontWeight: "bold" } }, "\u20B9", p.profit)))))));
  }
  function Settings() {
    const [serverUrl, setServerUrl] = useState(localStorage.getItem(API_URL_KEY) || window.location.origin);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, "Server Configuration"), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Server URL"), /* @__PURE__ */ React.createElement("input", { value: serverUrl, onChange: (e) => setServerUrl(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => {
      localStorage.setItem(API_URL_KEY, serverUrl);
      alert("Server URL saved.");
    } }, "Save")), /* @__PURE__ */ React.createElement("div", { className: "card mt-16" }, /* @__PURE__ */ React.createElement("h3", null, "About"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Sree Swamys Tractors"), " v1.0.0"), /* @__PURE__ */ React.createElement("p", null, "Inventory Management System")));
  }
  function App() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return /* @__PURE__ */ React.createElement(Login, null);
    return /* @__PURE__ */ React.createElement(HashRouter, null, /* @__PURE__ */ React.createElement(Layout, null, /* @__PURE__ */ React.createElement(Routes, null, /* @__PURE__ */ React.createElement(Route, { path: "/", element: /* @__PURE__ */ React.createElement(Dashboard, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/dashboard", element: /* @__PURE__ */ React.createElement(Dashboard, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/tractors", element: /* @__PURE__ */ React.createElement(Tractors, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/spares", element: /* @__PURE__ */ React.createElement(Spares, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/customers", element: /* @__PURE__ */ React.createElement(Customers, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/sales", element: /* @__PURE__ */ React.createElement(Sales, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/jobcards", element: /* @__PURE__ */ React.createElement(JobCards, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/staff", element: /* @__PURE__ */ React.createElement(Staff, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/salary", element: /* @__PURE__ */ React.createElement(Salary, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/reports", element: /* @__PURE__ */ React.createElement(Reports, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/settings", element: /* @__PURE__ */ React.createElement(Settings, null) }))));
  }
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
