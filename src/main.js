(function () {
  if (!location.hash) location.hash = "#/";
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<BB.Router />);
})();
