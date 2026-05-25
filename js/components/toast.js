function showToast(message, type = "info") {
  const root = document.getElementById("toastRoot");
  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    warning: "bg-amber-500",
    info: "bg-blue-600"
  };
  const toast = document.createElement("div");
  toast.className = `${colors[type] || colors.info} text-white rounded-lg px-4 py-3 shadow-lg text-sm`;
  toast.textContent = message;
  root.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
