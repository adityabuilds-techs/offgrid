import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShoppingBag,
  X,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  sizes: string[];
  stock: number;
  is_active: boolean;
};

type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

function App() {
  const path = window.location.pathname.toLowerCase();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [selectedSize, setSelectedSize] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [adminLoading, setAdminLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  /* =========================
     ADMIN AUTH
  ========================= */

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoggedIn(false);
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    setLoggedIn(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    setIsAdmin(profile?.role === "admin");
    setAdminLoading(false);
  };

  useEffect(() => {
    if (path !== "/admin") return;

    checkAdminAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdminAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [path]);

  /* =========================
     LOAD PRODUCTS
  ========================= */

  const loadProducts = async () => {
    setLoadingProducts(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ØFFGRID PRODUCTS:", error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoadingProducts(false);
  };

  useEffect(() => {
    if (path === "/") {
      loadProducts();
    }
  }, [path]);

  /* =========================
     CART
  ========================= */

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) {
      alert("SELECT A SIZE.");
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) =>
          item.product.id === selectedProduct.id &&
          item.size === selectedSize,
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === selectedProduct.id &&
          item.size === selectedSize
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  selectedProduct.stock,
                ),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product: selectedProduct,
          size: selectedSize,
          quantity: 1,
        },
      ];
    });

    setSelectedProduct(null);
    setSelectedSize("");
    setCartOpen(true);
  };

  const updateQuantity = (
    productId: string,
    size: string,
    change: number,
  ) => {
    setCart((current) =>
      current
        .map((item) => {
          if (
            item.product.id === productId &&
            item.size === size
          ) {
            return {
              ...item,
              quantity: Math.max(
                0,
                Math.min(
                  item.quantity + change,
                  item.product.stock,
                ),
              ),
            };
          }

          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0,
  );

  /* =========================
     CHECKOUT
  ========================= */

  const openCheckout = () => {
    if (cart.length === 0) {
      alert("YOUR BAG IS EMPTY.");
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const placeOrder = async () => {
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerPhone.trim() ||
      !customerAddress.trim()
    ) {
      alert("PLEASE COMPLETE ALL CHECKOUT DETAILS.");
      return;
    }

    if (!customerEmail.includes("@")) {
      alert("PLEASE ENTER A VALID EMAIL.");
      return;
    }

    setPlacingOrder(true);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        size: item.size,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error } = await supabase.from("orders").insert({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        address: customerAddress.trim(),
        items: orderItems,
        total: cartTotal,
        payment_status: "pending",
        order_status: "pending",
      });

      if (error) {
        console.error("ØFFGRID ORDER ERROR:", error);
        throw error;
      }

      setCart([]);
      setOrderPlaced(true);
    } catch (error) {
      console.error(error);
      alert("COULD NOT PLACE ORDER. PLEASE TRY AGAIN.");
    } finally {
      setPlacingOrder(false);
    }
  };

  /* =========================
     ADMIN ROUTE
  ========================= */

  if (path === "/admin") {
    if (adminLoading) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-[#f2f0eb]">
          <p className="text-xs tracking-[0.3em] text-white/40">
            ØFFGRID / CHECKING ACCESS...
          </p>
        </main>
      );
    }

    if (!loggedIn) {
      return <Login />;
    }

    if (!isAdmin) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-[#f2f0eb]">
          <div className="text-center">
            <h1 className="text-5xl font-black">
              ACCESS DENIED
            </h1>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="mt-8 border border-white/10 px-6 py-3 text-xs font-bold"
            >
              RETURN TO STORE
            </button>
          </div>
        </main>
      );
    }

    return <Admin />;
  }

  /* =========================
     STORE
  ========================= */

  return (
    <main className="min-h-screen bg-[#080808] text-[#f2f0eb]">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <a
            href="/"
            className="text-3xl font-black tracking-[-0.08em]"
          >
            ØFFGRID
          </a>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex h-11 items-center gap-2 border border-white/10 px-4 text-xs font-bold transition hover:bg-white hover:text-black"
          >
            <ShoppingBag size={17} />

            BAG

            {cartCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center bg-white px-1 text-[10px] text-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}

      <section className="relative flex min-h-[70vh] items-end overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_35%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 md:px-8 md:pb-24">
          <p className="mb-5 text-[10px] tracking-[0.45em] text-white/40">
            EST. 2026 / INDEPENDENT LABEL
          </p>

          <h1 className="max-w-5xl text-7xl font-black leading-[0.82] tracking-[-0.09em] sm:text-8xl md:text-[10rem]">
            WEAR
            <br />
            <span className="text-white/20">NOTHING</span>
            <br />
            ORDINARY.
          </h1>

          <div className="mt-10 flex items-center gap-3">
            <span className="h-px w-12 bg-white/30" />

            <p className="text-xs tracking-[0.25em] text-white/50">
              THE FIRST DROP
            </p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[10px] tracking-[0.35em] text-white/40">
              ØFFGRID / SHOP
            </p>

            <h2 className="text-5xl font-black tracking-[-0.07em] md:text-7xl">
              THE DROP
            </h2>
          </div>

          <span className="hidden text-xs text-white/30 sm:block">
            {products.length} ITEMS
          </span>
        </div>

        {loadingProducts ? (
          <div className="flex min-h-60 items-center justify-center border border-white/10">
            <Loader2
              size={22}
              className="animate-spin text-white/30"
            />
          </div>
        ) : products.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center">
            <p className="text-sm text-white/40">
              THE DROP IS COMING.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedSize("");
                }}
                className="group text-left"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#151515]">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* PRODUCT MODAL */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-5 backdrop-blur-md">
          <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center py-8">
            <div className="grid w-full overflow-hidden border border-white/10 bg-[#0d0d0d] md:grid-cols-2">
              <div className="aspect-[4/5] bg-[#151515] md:aspect-auto">
                {selectedProduct.images?.[0] && (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="p-6 md:p-10">
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X />
                  </button>
                </div>

                <p className="mt-6 text-[10px] tracking-[0.3em] text-white/30">
                  ØFFGRID / DROP 01
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">
                  {selectedProduct.name}
                </h2>

                <p className="mt-4 text-xl">
                  ₹
                  {selectedProduct.price.toLocaleString(
                    "en-IN",
                  )}
                </p>

                {selectedProduct.description && (
                  <p className="mt-6 text-sm leading-7 text-white/50">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="mt-10">
                  <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-white/40">
                    SELECT SIZE
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 border text-xs font-bold transition ${
                          selectedSize === size
                            ? "border-white bg-white text-black"
                            : "border-white/10 text-white/50 hover:border-white/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="mt-8 flex h-14 w-full items-center justify-center gap-2 bg-[#f2f0eb] text-sm font-black text-black transition hover:bg-white"
                >
                  ADD TO BAG
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART */}

      {cartOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-white/30">
                  ØFFGRID
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  YOUR BAG
                </h2>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-white/30">
                  YOUR BAG IS EMPTY.
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-4"
                    >
                      <div className="h-28 w-24 shrink-0 bg-[#151515]">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="font-bold">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          SIZE / {item.size}
                        </p>

                        <p className="mt-2 text-sm">
                          ₹
                          {item.product.price.toLocaleString(
                            "en-IN",
                          )}
                        </p>

                        <div className="mt-auto flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                -1,
                              )
                            }
                            className="border border-white/10 p-1"
                          >
                            <Minus size={13} />
                          </button>

                          <span className="text-xs">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                1,
                              )
                            }
                            className="border border-white/10 p-1"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] text-white/40">
                    TOTAL
                  </span>

                  <span className="text-2xl font-black">
                    ₹{cartTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={openCheckout}
                  className="flex h-14 w-full items-center justify-center gap-2 bg-[#f2f0eb] text-sm font-black text-black"
                >
                  CHECKOUT
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT */}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 p-5 backdrop-blur-md">
          <div className="mx-auto max-w-3xl py-8">
            <div className="border border-white/10 bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-[10px] tracking-[0.3em] text-white/30">
                    ØFFGRID / CHECKOUT
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
                    CHECKOUT
                  </h2>
                </div>

                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X />
                </button>
              </div>

              {orderPlaced ? (
                <div className="p-10 text-center md:p-16">
                  <CheckCircle2
                    size={48}
                    className="mx-auto mb-6"
                  />

                  <p className="text-[10px] tracking-[0.35em] text-white/40">
                    ØFFGRID / ORDER RECEIVED
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">
                    ORDER RECEIVED.
                  </h2>

                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/40">
                    Your order has been recorded. Payment
                    processing will be connected next.
                  </p>

                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderPlaced(false);
                      setCustomerName("");
                      setCustomerEmail("");
                      setCustomerPhone("");
                      setCustomerAddress("");
                    }}
                    className="mt-8 h-14 bg-white px-8 text-sm font-black text-black"
                  >
                    BACK TO STORE
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2">
                  {/* FORM */}

                  <div className="space-y-5 p-5 md:p-8">
                    <p className="text-xs font-bold tracking-[0.2em] text-white/50">
                      DELIVERY DETAILS
                    </p>

                    <input
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="FULL NAME"
                      className="h-14 w-full border border-white/10 bg-transparent px-4 text-sm outline-none focus:border-white/40"
                    />

                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(event) =>
                        setCustomerEmail(event.target.value)
                      }
                      placeholder="EMAIL"
                      className="h-14 w-full border border-white/10 bg-transparent px-4 text-sm outline-none focus:border-white/40"
                    />

                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) =>
                        setCustomerPhone(event.target.value)
                      }
                      placeholder="PHONE"
                      className="h-14 w-full border border-white/10 bg-transparent px-4 text-sm outline-none focus:border-white/40"
                    />

                    <textarea
                      value={customerAddress}
                      onChange={(event) =>
                        setCustomerAddress(event.target.value)
                      }
                      placeholder="FULL DELIVERY ADDRESS"
                      rows={5}
                      className="w-full resize-none border border-white/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-white/40"
                    />

                    <p className="text-[10px] leading-5 text-white/30">
                      PAYMENT IS NOT CHARGED YET. ONLINE PAYMENT
                      WILL BE CONNECTED IN THE NEXT STEP.
                    </p>
                  </div>

                  {/* SUMMARY */}

                  <div className="border-t border-white/10 p-5 md:border-l md:border-t-0 md:p-8">
                    <p className="text-xs font-bold tracking-[0.2em] text-white/50">
                      ORDER SUMMARY
                    </p>

                    <div className="mt-6 space-y-5">
                      {cart.map((item) => (
                        <div
                          key={`${item.product.id}-${item.size}`}
                          className="flex gap-3"
                        >
                          <div className="h-20 w-16 shrink-0 bg-[#151515]">
                            {item.product.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">
                              {item.product.name}
                            </p>

                            <p className="mt-1 text-[10px] text-white/40">
                              {item.size} × {item.quantity}
                            </p>

                            <p className="mt-2 text-sm">
                              ₹
                              {(
                                item.product.price *
                                item.quantity
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="my-7 border-t border-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs tracking-[0.2em] text-white/40">
                        TOTAL
                      </span>

                      <span className="text-3xl font-black">
                        ₹{cartTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={placeOrder}
                      disabled={placingOrder}
                      className="mt-8 flex h-14 w-full items-center justify-center gap-2 bg-white text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {placingOrder ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          PLACING ORDER...
                        </>
                      ) : (
                        <>
                          PLACE ORDER
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;