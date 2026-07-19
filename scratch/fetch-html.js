async function run() {
  const res = await fetch('http://localhost:3000/product/echo-tee-charcoal');
  const text = await res.text();
  console.log("=== Purchase Module Class Render Check ===");
  const index = text.indexOf('purchaseModule');
  if (index !== -1) {
    console.log(text.substring(index - 50, index + 350));
  } else {
    console.log("purchaseModule class NOT found in rendered HTML!");
  }
}
run().catch(console.error);
