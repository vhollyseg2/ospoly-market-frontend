import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'

// Alibaba Orange Theme
const colors = {
  primary: '#FF7300',
  secondary: '#FF5500',
  dark: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  border: '#E6E6E6',
  background: '#F5F5F5',
  white: '#FFFFFF',
  green: '#00A700',
  red: '#FF0000',
}

// Auth Context
const AuthContext = createContext()
const CartContext = createContext()

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) { setLoading(false); return }
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setUser(data.data.user)
      else localStorage.removeItem('accessToken')
    } catch {}
    setLoading(false)
  }
  
  useEffect(() => { checkAuth() }, [])
  
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (data.success) { localStorage.setItem('accessToken', data.data.accessToken); setUser(data.data.user); return { success: true } }
      return { success: false, message: data.message }
    } catch (e) { return { success: false, message: 'Network error. Please check your connection.' } }
  }
  
  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) })
      const data = await res.json()
      if (data.success) { localStorage.setItem('accessToken', data.data.accessToken); setUser(data.data.user); return { success: true } }
      return { success: false, message: data.message }
    } catch (e) { return { success: false, message: 'Network error. Please check your connection.' } }
  }
  
  const logout = () => { localStorage.removeItem('accessToken'); setUser(null); window.location.href = '/' }
  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))
  
  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
}

const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, shipping: 500, total: 500 })
  
  const fetchCart = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) { setItems(data.data.cart?.items || []); setSummary(data.data.summary) }
    } catch {}
  }
  
  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return { success: false, message: 'Please login first' }
    try {
      const res = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, quantity }) })
      const data = await res.json()
      if (data.success) { setItems(data.data.cart.items); setSummary(data.data.summary); return { success: true } }
      return { success: false, message: data.message }
    } catch { return { success: false, message: 'Network error' } }
  }
  
  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`/api/cart/remove/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) { setItems(data.data.cart.items); setSummary(data.data.summary) }
    } catch {}
  }
  
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) { removeFromCart(productId); return }
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch('/api/cart/update', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, quantity }) })
      const data = await res.json()
      if (data.success) { setItems(data.data.cart.items); setSummary(data.data.summary) }
    } catch {}
  }
  
  const clearCart = async () => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch('/api/cart/clear', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setItems([]); setSummary({ itemCount: 0, subtotal: 0, shipping: 500, total: 500 })
    } catch {}
  }
  
  useEffect(() => { fetchCart() }, [])
  
  return <CartContext.Provider value={{ items, summary, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>{children}</CartContext.Provider>
}

const useAuth = () => useContext(AuthContext)
const useCart = () => useContext(CartContext)

// Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-800'} text-white`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>{message}</span>
    </div>
  )
}

// Header
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { summary } = useCart()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    else navigate('/products')
  }

  const handleLogout = () => {
    logout()
    setToast({ message: 'Logged out successfully', type: 'success' })
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div style={{ backgroundColor: colors.dark }} className="text-white text-xs">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span>🇳🇬 Nigeria</span>
              <span>|</span>
              <span>Free Shipping ₦50,000+</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="hover:text-orange-400">My Orders</Link>
                  <span className="text-orange-400">{user?.name}</span>
                  <button onClick={handleLogout} className="hover:text-orange-400">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-orange-400">Sign In</Link>
                  <Link to="/register" className="hover:text-orange-400">Join Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: colors.primary }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4 py-3">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-white rounded-lg px-3 py-2">
                  <span style={{ color: colors.primary }} className="font-bold text-xl">OM</span>
                </div>
                <div className="text-white">
                  <span className="font-bold text-lg block leading-tight">Ospoly</span>
                  <span className="text-xs text-orange-200">Market</span>
                </div>
              </Link>
              
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="flex">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, suppliers..." className="flex-1 px-4 py-3 rounded-l-lg text-sm focus:outline-none" />
                  <button type="submit" className="px-6 py-3 bg-red-600 text-white font-bold rounded-r-lg hover:bg-red-700 transition-colors">Search</button>
                </div>
              </form>
              
              <Link to="/cart" className="relative flex items-center gap-2 text-white">
                <div className="bg-red-600 rounded-lg px-3 py-2"><span className="text-lg">🛒</span></div>
                {summary.itemCount > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{summary.itemCount}</span>}
              </Link>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
            <div className="flex items-center gap-1 py-2 overflow-x-auto">
              <Link to="/products" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">All Products</Link>
              <Link to="/products?category=phones-accessories" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">📱 Phones</Link>
              <Link to="/products?category=electronics" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">💻 Electronics</Link>
              <Link to="/products?category=furniture" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">🪑 Furniture</Link>
              <Link to="/products?category=fashion" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">👕 Fashion</Link>
              <Link to="/products?category=kitchen-home" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap">🏠 Home</Link>
              {(user?.role === 'seller' || user?.role === 'admin') && <Link to="/seller" className="px-4 py-2 text-sm font-medium text-orange-600 whitespace-nowrap">🏪 Seller Dashboard</Link>}
              {user?.role === 'admin' && <Link to="/admin" className="px-4 py-2 text-sm font-medium text-purple-600 whitespace-nowrap">⚙️ Admin</Link>}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

// Product Card
const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  
  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!user) { window.location.href = '/login'; return }
    const result = await addToCart(product._id)
    if (result?.success) setToast({ message: 'Added to cart!', type: 'success' })
    else setToast({ message: result?.message || 'Failed to add', type: 'error' })
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate(`/products/${product._id}`)}>
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          <span className="text-6xl opacity-50">📦</span>
          {discount > 0 && <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">-{discount}%</div>}
        </div>
        <div className="p-3">
          <div className="mb-2">
            <span className="text-xl font-bold" style={{ color: colors.primary }}>₦{product.price?.toLocaleString()}</span>
            {product.originalPrice && <span className="text-sm text-gray-400 line-through ml-2">₦{product.originalPrice?.toLocaleString()}</span>}
          </div>
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 hover:text-orange-600">{product.title}</h3>
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <span>{product.seller?.sellerProfile?.storeName || product.seller?.name}</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="text-yellow-500">⭐ {product.rating || 0}</span>
            <span>|</span>
            <span>{product.reviewCount || 0} sold</span>
          </div>
          <button onClick={handleAddToCart} className="w-full py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 transition-colors">
            Add to Cart
          </button>
        </div>
      </div>
    </>
  )
}

// Loading Skeleton
const LoadingSkeleton = ({ count = 10 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(count)].map((_, i) => <div key={i} className="bg-white rounded-lg h-80 animate-pulse"></div>)}
  </div>
)

// Home Page
const HomePage = () => {
  const [products, setProducts] = useState([])
  const [flashDeals, setFlashDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/products?limit=20').then(r => r.json()),
      fetch('/api/products/flash-deals').then(r => r.json()),
    ]).then(([productsData, dealsData]) => {
      if (productsData.success) setProducts(productsData.data.products)
      if (dealsData.success) setFlashDeals(dealsData.data.products)
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen">
      <div style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }} className="py-12">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4">Shop Direct from Campus Vendors</h1>
              <p className="text-lg text-orange-100 mb-6">Quality products at unbeatable prices. Verified sellers, secure payments, fast delivery.</p>
              <div className="flex gap-4">
                <Link to="/products" className="px-8 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100">Shop Now</Link>
                <Link to="/register" className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-orange-600">Become a Seller</Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[['📱', 'Phones', 'From ₦8,500'], ['💻', 'Electronics', 'From ₦15,000'], ['🪑', 'Furniture', 'From ₦35,000'], ['👕', 'Fashion', 'From ₦5,000']].map(([icon, name, price]) => (
                <div key={name} className="bg-white rounded-xl p-6 text-center shadow-xl">
                  <span className="text-5xl block mb-2">{icon}</span>
                  <p className="font-bold text-gray-800">{name}</p>
                  <p className="text-sm text-gray-500">{price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {flashDeals.length > 0 && (
        <div className="py-8 bg-white">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2">⚡ FLASH DEALS</div>
              </div>
              <Link to="/products?flash=true" className="text-orange-600 font-medium hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {flashDeals.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </div>
      )}

      <div className="py-8">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
            <Link to="/products" className="text-orange-600 font-medium hover:underline">View All →</Link>
          </div>
          {loading ? <LoadingSkeleton count={10} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <div className="py-8 bg-white">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Why Choose Ospoly Market</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[['🚚', 'Fast Delivery', 'Get your orders delivered quickly'], ['💰', 'Secure Payment', 'Protected transactions'], ['✓', 'Verified Sellers', 'Trusted campus vendors'], ['🛡️', 'Buyer Protection', 'Full refund guarantee']].map(([icon, title, desc]) => (
              <div key={title} className="text-center p-6 bg-gray-50 rounded-lg">
                <span className="text-4xl block mb-3">{icon}</span>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Products Page
const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const params = new URLSearchParams(window.location.search)
  const category = params.get('category') || ''
  const search = params.get('search') || ''

  useEffect(() => {
    setLoading(true)
    let url = '/api/products?limit=40'
    if (category) url += `&category=${category}`
    if (search) url += `&search=${search}`
    fetch(url).then(r => r.json()).then(d => { if (d.success) setProducts(d.data.products); setLoading(false) })
  }, [category, search])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white p-3 rounded">
          <Link to="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <span className="text-gray-800">{search ? `Search: "${search}"` : category ? category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Products'}</span>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{search ? `Results for "${search}"` : category ? category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Products'}</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} products found</p>
          </div>
        </div>
        
        {loading ? <LoadingSkeleton count={20} /> : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg">
            <span className="text-6xl block mb-4">🔍</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No products found</h2>
            <p className="text-gray-500">Try adjusting your search or browse all products</p>
            <Link to="/products" className="inline-block mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Browse All Products</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Product Detail Page
const ProductDetailPage = () => {
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const id = window.location.pathname.split('/').pop()

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => { if (d.success) setProduct(d.data.product); setLoading(false) })
  }, [id])

  const handleAddToCart = async () => {
    if (!user) { window.location.href = '/login'; return }
    const result = await addToCart(product._id, quantity)
    if (result?.success) setToast({ message: 'Added to cart!', type: 'success' })
    else setToast({ message: result?.message || 'Failed to add', type: 'error' })
  }

  const handleBuyNow = async () => {
    if (!user) { window.location.href = '/login'; return }
    const result = await addToCart(product._id, quantity)
    if (result?.success) navigate('/checkout')
    else setToast({ message: result?.message || 'Failed', type: 'error' })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
  if (!product) return <div className="min-h-screen flex items-center justify-center"><h2 className="text-2xl">Product not found</h2></div>

  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-6">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white p-3 rounded">
            <Link to="/" className="hover:text-orange-600">Home</Link><span>/</span>
            <Link to="/products" className="hover:text-orange-600">Products</Link><span>/</span>
            <span className="text-gray-800 truncate">{product.title}</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 flex items-center justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center text-8xl">📦</div>
                {discount > 0 && <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded">-{discount}% OFF</div>}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">{product.title}</h1>
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="text-yellow-500 font-bold">⭐ {product.rating || 0}</span>
                  <span className="text-gray-500">{product.reviewCount || 0} reviews</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-500">{product.views || 0} views</span>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold" style={{ color: colors.primary }}>₦{product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-gray-400 line-through">₦{product.originalPrice?.toLocaleString()}</span>
                        <span className="text-red-500 font-bold text-sm">Save {discount}%</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm mb-4">
                  <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                    {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : 'Out of Stock'}
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-gray-600 capitalize">{product.condition}</span>
                  {product.brand && <span className="bg-gray-100 px-3 py-1 rounded text-gray-600">{product.brand}</span>}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-600">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-gray-100 text-lg">-</button>
                    <span className="px-4 py-2 font-bold border-x border-gray-300">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-4 py-2 hover:bg-gray-100 text-lg">+</button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button onClick={handleAddToCart} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">🛒 Add to Cart</button>
                  <button onClick={handleBuyNow} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Buy Now</button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-3">Supplier Information</h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">{product.seller?.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{product.seller?.sellerProfile?.storeName || product.seller?.name}</p>
                    <p className="text-xs text-green-600">✓ Verified Supplier</p>
                  </div>
                </div>
                {product.location && <p className="text-sm text-gray-500">📍 {product.location}</p>}
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-3">Product Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Cart Page
const CartPage = () => {
  const { user } = useAuth()
  const { items, summary, removeFromCart, updateQuantity } = useCart()
  const navigate = useNavigate()

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-center bg-white p-8 rounded-lg shadow"><h2 className="text-2xl font-bold mb-4">Please sign in to view your cart</h2><Link to="/login" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Sign In</Link></div></div>
  if (items.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-center bg-white p-8 rounded-lg shadow"><span className="text-6xl block mb-4">🛒</span><h2 className="text-2xl font-bold mb-4">Your cart is empty</h2><Link to="/products" className="px-8 py-3 bg-orange-500 text-white font-bold rounded-lg">Start Shopping</Link></div></div>

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({summary.itemCount} items)</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product?._id} className="bg-white rounded-lg p-4 flex gap-4 border border-gray-200">
                <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center text-4xl">📦</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{item.product?.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">Supplier: {item.product?.seller?.name}</p>
                  <p className="text-lg font-bold" style={{ color: colors.primary }}>₦{item.product?.price?.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.product?._id)} className="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button onClick={() => updateQuantity(item.product?._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100">-</button>
                    <span className="px-3 py-1 font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product?._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm border-b pb-4 mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal ({summary.itemCount} items)</span><span className="font-bold">₦{summary.subtotal?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-bold">₦{summary.shipping?.toLocaleString()}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
            </div>
            <button onClick={() => navigate('/checkout')} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Checkout Page
const CheckoutPage = () => {
  const { user } = useAuth()
  const { items, summary, clearCart } = useCart()
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><h2 className="text-2xl">Please sign in</h2></div>
  if (items.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-center bg-white p-8 rounded-lg shadow"><h2 className="text-2xl font-bold mb-4">Your cart is empty</h2><Link to="/products" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Shop Now</Link></div></div>

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.state) {
      setToast({ message: 'Please fill all shipping address fields', type: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ shippingAddress: address }) })
      const data = await res.json()
      setLoading(false)
      if (data.success) { 
        clearCart()
        setToast({ message: '🎉 Order placed successfully!', type: 'success' })
        setTimeout(() => navigate('/orders'), 1500)
      } else {
        setToast({ message: data.message || 'Order failed', type: 'error' })
      }
    } catch { setLoading(false); setToast({ message: 'Network error', type: 'error' }) }
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-6">
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📍 Shipping Address</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                    <input value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="Enter your full name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Phone Number *</label>
                    <input value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="+234..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Street Address *</label>
                    <input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="House number, street name" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">City *</label>
                    <input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">State *</label>
                    <input value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm">
                  <p className="font-medium text-yellow-800">💡 Cash on Delivery: Pay when you receive your order</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm border-b pb-4 mb-4">
                {items.map(item => (
                  <div key={item.product?._id} className="flex justify-between">
                    <span className="text-gray-600 truncate">{item.product?.title?.substring(0, 20)}...</span>
                    <span className="font-bold">×{item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between"><span>Shipping</span><span className="font-bold">₦{summary.shipping?.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// My Orders Page
const MyOrdersPage = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return }
    fetch('/api/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data.orders); setLoading(false) })
  }, [user])

  if (!user) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-purple-100 text-purple-700'
      case 'shipped': return 'bg-indigo-100 text-indigo-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📦 My Orders</h1>
        
        {loading ? <LoadingSkeleton count={5} /> : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                
                <div className="flex gap-4 mb-4">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-2xl">📦</div>
                  ))}
                  {order.items.length > 3 && <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">+{order.items.length - 3} more</div>}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <p>{order.items.length} item(s)</p>
                    <p>Shipping to: {order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold" style={{ color: colors.primary }}>₦{order.finalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg">
            <span className="text-6xl block mb-4">📦</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500">Start shopping to see your orders here</p>
            <Link to="/products" className="inline-block mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Browse Products</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Login Page
const LoginPage = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { window.location.href = '/'; return null }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.message || 'Login failed')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: colors.primary }} className="p-6 text-center">
          <div className="bg-white rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span style={{ color: colors.primary }} className="text-2xl font-bold">OM</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-orange-100 text-sm mt-1">Sign in to your Ospoly Market account</p>
        </div>
        
        <div className="p-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">🔑 Demo Accounts:</p>
            <p className="text-sm text-gray-600">admin@ospolymarket.com / Admin@123456</p>
            <p className="text-sm text-gray-600">seller@ospolymarket.com / Seller@123456</p>
            <p className="text-sm text-gray-600">buyer@ospolymarket.com / Buyer@123456</p>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">Don't have an account? <Link to="/register" className="text-orange-600 font-bold hover:underline">Join Free</Link></p>
        </div>
      </div>
    </div>
  )
}

// Register Page
const RegisterPage = () => {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) { window.location.href = '/'; return null }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await register(form)
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.message || 'Registration failed')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: colors.primary }} className="p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-orange-100 text-sm mt-1">Join Ospoly Market - It's Free!</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button type="button" onClick={() => setForm({...form, role: 'buyer'})} className={`p-4 border-2 rounded-lg text-center transition-all ${form.role === 'buyer' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <span className="text-3xl block mb-2">🛒</span>
              <span className={`font-bold ${form.role === 'buyer' ? 'text-orange-600' : 'text-gray-600'}`}>Buyer</span>
            </button>
            <button type="button" onClick={() => setForm({...form, role: 'seller'})} className={`p-4 border-2 rounded-lg text-center transition-all ${form.role === 'seller' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <span className="text-3xl block mb-2">🏪</span>
              <span className={`font-bold ${form.role === 'seller' ? 'text-orange-600' : 'text-gray-600'}`}>Seller</span>
            </button>
          </div>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="Your full name" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="+234..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" placeholder="Min 8 characters" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}

// Seller Dashboard
const SellerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) { window.location.href = '/login'; return }
    fetch('/api/orders/seller/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
    
    fetch('/api/products/seller/my-products', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data.products) })
    
    fetch('/api/orders/seller/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data.orders); setLoading(false) })
  }, [user])

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (data.success) { setToast({ message: 'Order status updated!', type: 'success' }); window.location.reload() }
    } catch { setToast({ message: 'Failed to update', type: 'error' }) }
  }

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-6">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Seller Dashboard</h1>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.stats?.pendingOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">Products</p>
              <p className="text-3xl font-bold text-orange-600">{products.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 font-medium ${activeTab === 'overview' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>Overview</button>
              <button onClick={() => setActiveTab('products')} className={`px-6 py-4 font-medium ${activeTab === 'products' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>My Products ({products.length})</button>
              <button onClick={() => setActiveTab('orders')} className={`px-6 py-4 font-medium ${activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>Orders ({orders.length})</button>
            </div>
            
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">Quick Actions</h3>
                    <p className="text-sm text-gray-500">Manage your products and orders from here.</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">Store Performance</h3>
                    <p className="text-sm text-gray-500">Rating: ⭐ {user?.sellerProfile?.rating || 0} | Sales: {user?.sellerProfile?.totalSales || 0}</p>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  {products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="text-left text-sm text-gray-500 border-b"><th className="pb-4">Product</th><th className="pb-4">Price</th><th className="pb-4">Stock</th><th className="pb-4">Status</th></tr></thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p._id} className="border-b">
                              <td className="py-4">{p.title}</td>
                              <td className="py-4 font-bold">₦{p.price?.toLocaleString()}</td>
                              <td className="py-4">{p.stock}</td>
                              <td className="py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.isApproved ? '✓ Active' : '⏳ Pending'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-center py-12 text-gray-500">No products yet</p>}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-bold">Order #{order._id.slice(-8).toUpperCase()}</p>
                              <p className="text-sm text-gray-500">{order.buyer?.name} | {order.buyer?.phone}</p>
                              <p className="text-sm text-gray-500">{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₦{order.finalAmount?.toLocaleString()}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
                            <div className="flex gap-2">
                              {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg">Confirm</button>}
                              {order.status === 'confirmed' && <button onClick={() => handleUpdateStatus(order._id, 'processing')} className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg">Process</button>}
                              {order.status === 'processing' && <button onClick={() => handleUpdateStatus(order._id, 'shipped')} className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg">Ship</button>}
                              {order.status === 'shipped' && <button onClick={() => handleUpdateStatus(order._id, 'delivered')} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg">Delivered</button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-12 text-gray-500">No orders yet</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Admin Dashboard
const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') { window.location.href = '/login'; return }
    fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); setLoading(false) })
  }, [user])

  if (!user || user.role !== 'admin') return null

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Admin Dashboard</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Sellers</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.stats?.totalSellers || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Products</p>
            <p className="text-3xl font-bold text-green-600">{stats?.stats?.totalProducts || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Orders</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.stats?.totalOrders || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Revenue</p>
            <p className="text-2xl font-bold text-purple-600">₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Recent Users</h3>
            {stats?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
            {stats?.recentOrders?.map(o => (
              <div key={o._id} className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">#{o._id?.slice(-6)}</p>
                  <p className="text-sm text-gray-500">{o.buyer?.name}</p>
                </div>
                <span className="font-bold text-orange-600">₦{o.finalAmount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Page
const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return }
    setForm({ name: user.name || '', phone: user.phone || '', street: user.address?.street || '', city: user.address?.city || '', state: user.address?.state || '' })
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(form) })
      const data = await res.json()
      setLoading(false)
      if (data.success) { updateUser(data.data.user); setToast({ message: 'Profile updated!', type: 'success' }) }
    } catch { setLoading(false); setToast({ message: 'Failed to update', type: 'error' }) }
  }

  if (!user) return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-6">
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 My Profile</h1>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-orange-600">{user.name?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{user.role}</span>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
                <input value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

// Footer
const Footer = () => (
  <footer style={{ backgroundColor: colors.dark }} className="text-gray-300 py-10">
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="px-4">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white rounded px-2 py-1"><span style={{ color: colors.primary }} className="font-bold">OM</span></div>
            <span className="font-bold text-white">Ospoly Market</span>
          </div>
          <p className="text-sm">Your trusted campus marketplace for buying and selling quality products at the best prices.</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-orange-400">All Products</Link></li>
            <li><Link to="/seller" className="hover:text-orange-400">Become a Seller</Link></li>
            <li><Link to="/register" className="hover:text-orange-400">Join Free</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-orange-400">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-400">Contact Us</a></li>
            <li><a href="#" className="hover:text-orange-400">FAQs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>📧 support@ospolymarket.com</li>
            <li>📱 +234 800 123 4567</li>
            <li>📍 Lagos, Nigeria</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-6 text-center text-sm">
        <p>© {new Date().getFullYear()} Ospoly Market. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

// Main App
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-400">404 - Page Not Found</h1></div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App