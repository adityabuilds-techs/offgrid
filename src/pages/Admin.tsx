import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  LogOut,
  Package,
  Plus,
  Trash2,
  X,
  ShoppingBag,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";

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

type OrderItem = {
  product_id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showOrders, setShowOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ØFFGRID PRODUCTS:", error);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ØFFGRID ORDERS:", error);
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLoadingOrders(false);
  };

  const updateOrderStatus = async (
    orderId: string,
    status: string,
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({
        order_status: status,
      })
      .eq("id", orderId);

    if (error) {
      console.error("ØFFGRID ORDER UPDATE:", error);
      alert("Could not update order status.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              order_status: status,
            }
          : order,
      ),
    );

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        order_status: status,
      });
    }
  };

  const toggleSize = (size: string) => {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    );
  };

  const publishProduct = async () => {
    if (!name || !price || !stock || !image) {
      alert(
        "Please fill in the product name, price, stock and image.",
      );
      return;
    }

    if (sizes.length === 0) {
      alert("Select at least one size.");
      return;
    }

    setPublishing(true);

    try {
      const fileExtension = image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("offgrid-products")
        .upload(filePath, image);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("offgrid-products")
        .getPublicUrl(filePath);

      const { error: productError } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price: Number(price),
          stock: Number(stock),
          sizes,
          images: [publicUrl],
          is_active: true,
        });

      if (productError) {
        throw productError;
      }

      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setSizes([]);
      setImage(null);
      setShowAddProduct(false);

      await loadProducts();

      alert("ØFFGRID PRODUCT PUBLISHED.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while publishing.");
    } finally {
      setPublishing(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}" from ØFFGRID?`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      console.error(error);
      alert("Could not delete the product.");
      return;
    }

    await loadProducts();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const pendingOrders = orders.filter(
    (order) => order.order_status === "pending",
  ).length;

  return (
    <main className="min-h-screen bg-[#080808] text-[#f2f0eb]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <div>
            <p className="text-2xl font-black tracking-[-0.08em]">
              ØFFGRID
            </p>

            <p className="mt-1 text-[9px] tracking-[0.35em] text-white/40">
              HQ / ADMIN
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex h-10 items-center gap-2 border border-white/10 px-4 text-xs font-bold transition hover:bg-white hover:text-black"
            >
              <ArrowLeft size={15} />
              STORE
            </a>

            <button
              onClick={logout}
              className="flex h-10 items-center gap-2 border border-white/10 px-4 text-xs font-bold transition hover:bg-white hover:text-black"
            >
              <LogOut size={15} />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs tracking-[0.3em] text-white/40">
              ØFFGRID / CONTROL
            </p>

            <h1 className="text-5xl font-black tracking-[-0.07em] md:text-7xl">
              HQ
            </h1>
          </div>

          <button
            onClick={() => setShowAddProduct(true)}
            className="flex h-14 items-center justify-center gap-2 bg-[#f2f0eb] px-6 text-sm font-black text-black transition hover:bg-white"
          >
            <Plus size={18} />
            ADD PRODUCT
          </button>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border border-white/10 p-5">
            <Package
              size={18}
              className="mb-5 text-white/40"
            />

            <p className="text-3xl font-black">
              {products.length}
            </p>

            <p className="mt-1 text-[10px] tracking-[0.25em] text-white/40">
              PRODUCTS
            </p>
          </div>

          <div className="border border-white/10 p-5">
            <p className="mb-5 text-lg">●</p>

            <p className="text-3xl font-black">
              {
                products.filter(
                  (product) => product.is_active,
                ).length
              }
            </p>

            <p className="mt-1 text-[10px] tracking-[0.25em] text-white/40">
              LIVE
            </p>
          </div>

          <div className="border border-white/10 p-5">
            <ShoppingBag
              size={18}
              className="mb-5 text-white/40"
            />

            <p className="text-3xl font-black">
              {orders.length}
            </p>

            <p className="mt-1 text-[10px] tracking-[0.25em] text-white/40">
              ORDERS
            </p>
          </div>

          <div className="border border-white/10 p-5">
            <p className="mb-5 text-lg">!</p>

            <p className="text-3xl font-black">
              {pendingOrders}
            </p>

            <p className="mt-1 text-[10px] tracking-[0.25em] text-white/40">
              PENDING
            </p>
          </div>
        </div>

        <section className="mb-16">
          <button
            onClick={() => setShowOrders(!showOrders)}
            className="mb-5 flex w-full items-center justify-between border-b border-white/10 pb-5 text-left"
          >
            <div>
              <p className="text-xs tracking-[0.3em] text-white/40">
                ØFFGRID / SALES
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.06em]">
                ORDERS
              </h2>
            </div>

            <ChevronDown
              size={22}
              className={`transition ${
                showOrders ? "rotate-180" : ""
              }`}
            />
          </button>

          {showOrders && (
            <>
              {loadingOrders ? (
                <div className="border border-white/10 p-10 text-center text-sm text-white/40">
                  LOADING ORDERS...
                </div>
              ) : orders.length === 0 ? (
                <div className="border border-dashed border-white/10 p-16 text-center">
                  <ShoppingBag
                    size={32}
                    className="mx-auto mb-5 text-white/20"
                  />

                  <h3 className="text-xl font-bold">
                    NO ORDERS YET
                  </h3>

                  <p className="mt-2 text-sm text-white/40">
                    Orders will appear here when customers
                    checkout.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="w-full border border-white/10 p-5 text-left transition hover:border-white/30"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">
                              {order.customer_name}
                            </span>

                            <span className="text-[9px] tracking-[0.15em] text-white/30">
                              #
                              {order.id
                                .slice(0, 8)
                                .toUpperCase()}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-white/40">
                            {new Date(
                              order.created_at,
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`border px-3 py-2 text-[9px] font-bold tracking-[0.15em] ${
                              order.payment_status ===
                              "paid"
                                ? "border-white/30 text-white"
                                : "border-white/10 text-white/40"
                            }`}
                          >
                            PAYMENT /{" "}
                            {order.payment_status.toUpperCase()}
                          </span>

                          <span className="border border-white/10 px-3 py-2 text-[9px] font-bold tracking-[0.15em] text-white/60">
                            {order.order_status.toUpperCase()}
                          </span>

                          <span className="font-black">
                            ₹
                            {Number(
                              order.total,
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <div className="mb-5 border-b border-white/10 pb-5">
            <p className="text-xs tracking-[0.3em] text-white/40">
              ØFFGRID / INVENTORY
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.06em]">
              PRODUCTS
            </h2>
          </div>

          {loading ? (
            <div className="border border-white/10 p-10 text-center text-sm text-white/40">
              LOADING ØFFGRID INVENTORY...
            </div>
          ) : products.length === 0 ? (
            <div className="border border-dashed border-white/10 p-16 text-center">
              <Package
                size={32}
                className="mx-auto mb-5 text-white/20"
              />

              <h2 className="text-xl font-bold">
                NO PRODUCTS YET
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Your first drop is waiting.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden border border-white/10"
                >
                  <div className="aspect-[4/5] bg-[#151515]">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/20">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          ₹
                          {product.price.toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          deleteProduct(product)
                        }
                        className="text-white/30 transition hover:text-white"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <span
                          key={size}
                          className="border border-white/10 px-2 py-1 text-[10px] text-white/50"
                        >
                          {size}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 text-[10px] tracking-[0.2em] text-white/30">
                      STOCK: {product.stock}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-5 py-8 backdrop-blur-md">
          <div className="mx-auto max-w-3xl border border-white/10 bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs tracking-[0.3em] text-white/40">
                  ØFFGRID / ORDER
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  #
                  {selectedOrder.id
                    .slice(0, 8)
                    .toUpperCase()}
                </h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white/50 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="space-y-8 p-5 md:p-8">
              <div>
                <p className="mb-4 text-[10px] font-bold tracking-[0.25em] text-white/40">
                  CUSTOMER
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-white/10 p-4">
                    <p className="mb-2 text-white/30">
                      <Mail size={15} />
                    </p>

                    <p className="text-sm">
                      {selectedOrder.customer_email}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="mb-2 text-white/30">
                      <Phone size={15} />
                    </p>

                    <p className="text-sm">
                      {selectedOrder.customer_phone}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4 sm:col-span-2">
                    <p className="mb-2 text-white/30">
                      <MapPin size={15} />
                    </p>

                    <p className="text-sm leading-6">
                      {selectedOrder.address}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-4 text-[10px] font-bold tracking-[0.25em] text-white/40">
                  ORDER ITEMS
                </p>

                <div className="divide-y divide-white/10 border border-white/10">
                  {selectedOrder.items.map(
                    (item, index) => (
                      <div
                        key={`${item.product_id}-${item.size}-${index}`}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div>
                          <p className="text-sm font-bold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            SIZE / {item.size}
                            &nbsp;·&nbsp; QTY /{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          ₹
                          {(
                            item.price * item.quantity
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="mb-4 text-[10px] font-bold tracking-[0.25em] text-white/40">
                  ORDER CONTROL
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.2em] text-white/30">
                      PAYMENT
                    </label>

                    <div className="flex h-14 items-center border border-white/10 px-4 text-xs font-bold">
                      {selectedOrder.payment_status.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.2em] text-white/30">
                      ORDER STATUS
                    </label>

                    <select
                      value={selectedOrder.order_status}
                      onChange={(event) =>
                        updateOrderStatus(
                          selectedOrder.id,
                          event.target.value,
                        )
                      }
                      className="h-14 w-full border border-white/10 bg-[#0d0d0d] px-4 text-xs font-bold outline-none"
                    >
                      <option value="pending">
                        PENDING
                      </option>

                      <option value="processing">
                        PROCESSING
                      </option>

                      <option value="shipped">
                        SHIPPED
                      </option>

                      <option value="delivered">
                        DELIVERED
                      </option>

                      <option value="cancelled">
                        CANCELLED
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <span className="text-xs tracking-[0.2em] text-white/40">
                  ORDER TOTAL
                </span>

                <span className="text-3xl font-black">
                  ₹
                  {Number(
                    selectedOrder.total,
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-5 py-8 backdrop-blur-md">
          <div className="mx-auto max-w-2xl border border-white/10 bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs tracking-[0.3em] text-white/40">
                  ØFFGRID / NEW
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  ADD PRODUCT
                </h2>
              </div>

              <button
                onClick={() => setShowAddProduct(false)}
                className="text-white/50 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="space-y-7 p-5 md:p-8">
              <div>
                <label className="mb-3 block text-xs font-bold tracking-[0.2em] text-white/50">
                  PRODUCT IMAGE
                </label>

                <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-white/20 bg-[#151515] transition hover:border-white/50">
                  {image ? (
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <ImagePlus
                        size={28}
                        className="mb-3 text-white/30"
                      />

                      <span className="text-xs text-white/40">
                        TAP TO UPLOAD
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0];

                      if (file) {
                        setImage(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-[0.2em] text-white/50">
                  PRODUCT NAME
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="ØFFGRID CORE TEE"
                  className="w-full border border-white/10 bg-transparent px-4 py-4 outline-none transition focus:border-white/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-[0.2em] text-white/50">
                  DESCRIPTION
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Product description..."
                  rows={4}
                  className="w-full resize-none border border-white/10 bg-transparent px-4 py-4 outline-none transition focus:border-white/40"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.2em] text-white/50">
                    PRICE / INR
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="1499"
                    className="w-full border border-white/10 bg-transparent px-4 py-4 outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.2em] text-white/50">
                    STOCK
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(event) =>
                      setStock(event.target.value)
                    }
                    placeholder="25"
                    className="w-full border border-white/10 bg-transparent px-4 py-4 outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-bold tracking-[0.2em] text-white/50">
                  AVAILABLE SIZES
                </label>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {availableSizes.map((size) => {
                    const selected =
                      sizes.includes(size);

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          toggleSize(size)
                        }
                        className={`h-12 border text-xs font-bold transition ${
                          selected
                            ? "border-white bg-white text-black"
                            : "border-white/10 text-white/50 hover:border-white/40"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={publishProduct}
                disabled={publishing}
                className="flex h-14 w-full items-center justify-center gap-2 bg-[#f2f0eb] text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? (
                  "PUBLISHING..."
                ) : (
                  <>
                    <Plus size={18} />
                    PUBLISH PRODUCT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Admin;