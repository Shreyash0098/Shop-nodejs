const deleteProduct = (btn) => {
  const parent = btn.closest(".card");
  const productId = parent.querySelector("[name=productId]").value;
  const csrf = parent.querySelector("[name=_csrf]").value;
  fetch("/admin/product/" + productId, {
    method: "delete",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      parent.remove();
    })
    .catch((err) => console.log(err));
};
