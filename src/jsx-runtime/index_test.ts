import { assertEquals } from "@std/assert";
import { Fragment, jsx, jsxs, raw, render } from "./index.ts";

Deno.test("jsx creates simple HTML element", () => {
  const result = jsx("div", { children: "Hello" });
  assertEquals(render(result), "<div>Hello</div>");
});

Deno.test("jsx escapes HTML in text content", () => {
  const result = jsx("div", { children: "<script>alert('xss')</script>" });
  assertEquals(
    render(result),
    "<div>&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;</div>",
  );
});

Deno.test("jsx handles attributes", () => {
  const result = jsx("a", { href: "/path", title: "Link", children: "Click" });
  assertEquals(render(result), '<a href="/path" title="Link">Click</a>');
});

Deno.test("jsx escapes attribute values", () => {
  const result = jsx("input", { value: 'test"value' });
  assertEquals(render(result), '<input value="test&quot;value">');
});

Deno.test("jsx handles className prop", () => {
  const result = jsx("div", { className: "foo bar", children: "test" });
  assertEquals(render(result), '<div class="foo bar">test</div>');
});

Deno.test("jsx handles boolean attributes", () => {
  const result = jsx("input", { type: "checkbox", checked: true, disabled: false });
  assertEquals(render(result), '<input type="checkbox" checked>');
});

Deno.test("jsx handles void elements", () => {
  const result = jsx("br", {});
  assertEquals(render(result), "<br>");
});

Deno.test("jsx handles void elements with attributes", () => {
  const result = jsx("img", { src: "/image.png", alt: "Image" });
  assertEquals(render(result), '<img src="/image.png" alt="Image">');
});

Deno.test("jsx handles nested elements", () => {
  const result = jsx("div", {
    children: jsx("span", { children: "nested" }),
  });
  assertEquals(render(result), "<div><span>nested</span></div>");
});

Deno.test("jsx handles array children", () => {
  const result = jsx("ul", {
    children: [
      jsx("li", { children: "one" }),
      jsx("li", { children: "two" }),
    ],
  });
  assertEquals(render(result), "<ul><li>one</li><li>two</li></ul>");
});

Deno.test("jsx handles Fragment", () => {
  const result = jsx(Fragment, {
    children: [
      jsx("span", { children: "a" }),
      jsx("span", { children: "b" }),
    ],
  });
  assertEquals(render(result), "<span>a</span><span>b</span>");
});

Deno.test("jsx handles null and undefined children", () => {
  const result = jsx("div", {
    children: [null, "visible", undefined],
  });
  assertEquals(render(result), "<div>visible</div>");
});

Deno.test("jsx handles false and true children (filtered)", () => {
  const result = jsx("div", {
    children: [false, "shown", true],
  });
  assertEquals(render(result), "<div>shown</div>");
});

Deno.test("jsx handles number children", () => {
  const result = jsx("span", { children: 42 });
  assertEquals(render(result), "<span>42</span>");
});

Deno.test("jsxs is alias for jsx", () => {
  const result = jsxs("div", { children: ["a", "b"] });
  assertEquals(render(result), "<div>ab</div>");
});

Deno.test("raw inserts HTML without escaping", () => {
  const result = jsx("div", { children: raw("<b>bold</b>") });
  assertEquals(render(result), "<div><b>bold</b></div>");
});

Deno.test("jsx handles function components", () => {
  function Greeting(props: { name: string }) {
    return jsx("span", { children: `Hello, ${props.name}!` });
  }

  const result = jsx(Greeting, { name: "World" });
  assertEquals(render(result), "<span>Hello, World!</span>");
});

Deno.test("jsx handles data-* attributes", () => {
  const result = jsx("div", { "data-id": "123", "data-testId": "test" });
  assertEquals(render(result), '<div data-id="123" data-test-id="test"></div>');
});

Deno.test("jsx handles aria-* attributes", () => {
  const result = jsx("button", { "aria-label": "Close", "aria-hidden": false });
  assertEquals(render(result), '<button aria-label="Close"></button>');
});
