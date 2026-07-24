import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'https://ospoly-market-api.onrender.com'

const getProductImage = (product, index = 0) => {
  const image = product?.images?.[index]
  const url = typeof image === 'string' ? image : image?.url || ''
  if (url.startsWith('/')) return `${API_URL}${url}`
  return url
}

const ProductImage = ({ product, index = 0, alt, className = '', fallbackClassName = '' }) => {
  const [failed, setFailed] = useState(false)
  const src = getProductImage(product, index)
  if (!src || failed) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 flex items-center justify-center ${fallbackClassName}`} role="img" aria-label={alt || product?.title || 'Product image unavailable'}>
        <div className="text-center text-gray-400">
          <span className="text-4xl sm:text-5xl block">🛍️</span>
          <span className="text-[10px] sm:text-xs mt-2 block">Image coming soon</span>
        </div>
      </div>
    )
  }
  return <img src={src} alt={alt || product?.title || 'Product'} className={`product-image ${className}`} loading="lazy" onError={() => setFailed(true)} />
}

const VerificationBadge = ({ level = 'identity_verified' }) => {
  const levels = {
    unverified: { label: 'Unverified', icon: '○', className: 'bg-gray-100 text-gray-600' },
    identity_verified: { label: 'Identity Verified', icon: '✓', className: 'bg-blue-100 text-blue-700' },
    bank_verified: { label: 'Bank Verified', icon: '✓', className: 'bg-purple-100 text-purple-700' },
    trusted: { label: 'Trusted Seller', icon: '★', className: 'bg-green-100 text-green-700' }
  }
  const item = levels[level] || levels.unverified
  return <span title="Verification reflects completed Campus Market checks, not a guarantee of every transaction." className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${item.className}`}>{item.icon} {item.label}</span>
}

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

const MARKET_CATEGORIES = [
  { slug: 'phones-accessories', icon: '📱', name: 'Phones & Accessories', short: 'Phones', description: 'Phones, chargers, cases and accessories' },
  { slug: 'electronics', icon: '🎧', name: 'Electronics', short: 'Electronics', description: 'Audio, TVs, computers and gadgets' },
  { slug: 'fashion', icon: '👕', name: 'Fashion', short: 'Fashion', description: 'Clothing, shoes, bags and jewellery' },
  { slug: 'kitchen-home', icon: '🏠', name: 'Apartment & Home', short: 'Apartment', description: 'Kitchen, appliances and room essentials' },
  { slug: 'furniture', icon: '🪑', name: 'Furniture', short: 'Furniture', description: 'Desks, chairs, beds and storage' },
  { slug: 'beauty-health', icon: '💄', name: 'Beauty & Health', short: 'Beauty', description: 'Skincare, haircare and personal care' },
  { slug: 'books-education', icon: '📚', name: 'Books & Education', short: 'Books', description: 'Textbooks, stationery and learning tools' },
  { slug: 'groceries', icon: '🛒', name: 'Groceries', short: 'Groceries', description: 'Food, drinks and everyday essentials' },
  { slug: 'sports-fitness', icon: '⚽', name: 'Sports & Fitness', short: 'Sports', description: 'Sportswear, equipment and fitness gear' },
  { slug: 'baby-kids', icon: '🧸', name: 'Baby & Kids', short: 'Kids', description: 'Clothing, toys and baby essentials' },
  { slug: 'automotive', icon: '🚗', name: 'Automotive', short: 'Automotive', description: 'Vehicle accessories and spare parts' },
  { slug: 'other', icon: '📦', name: 'Other Products', short: 'Other', description: 'More useful products from local sellers' }
]

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

// Auth Context
const AuthContext = createContext()
const CartContext = createContext()
const WishlistContext = createContext()
const NotificationContext = createContext()
const ChatContext = createContext()

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data.user) })
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false))
  }, [])
  
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }) 
      })
      const data = await res.json()
      if (data.success) { 
        localStorage.setItem('accessToken', data.data.accessToken)
        setUser(data.data.user)
        return { success: true } 
      }
      return { success: false, message: data.message }
    } catch (e) { 
      return { success: false, message: 'Cannot connect to server' } 
    }
  }
  
  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(userData) 
      })
      const data = await res.json()
      if (data.success) { 
        localStorage.setItem('accessToken', data.data.accessToken)
        setUser(data.data.user)
        return { success: true } 
      }
      return { success: false, message: data.message }
    } catch (e) { 
      return { success: false, message: 'Cannot connect to server' } 
    }
  }
  
  const logout = () => { 
    localStorage.removeItem('accessToken')
    setUser(null)
    window.location.href = '/' 
  }
  
  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))
  
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// Wishlist Provider
const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useContext(AuthContext)
  
  useEffect(() => {
    const stored = localStorage.getItem('wishlist')
    if (stored) {
      setWishlist(JSON.parse(stored))
    }
    setLoading(false)
  }, [])
  
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  }, [wishlist])
  
  const addToWishlist = (product) => {
    if (wishlist.find(w => w._id === product._id)) return
    setWishlist(prev => [...prev, product])
  }
  
  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(w => w._id !== productId))
  }
  
  const isInWishlist = (productId) => wishlist.some(w => w._id === productId)
  
  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

// Recently Viewed Provider
const RecentlyViewedProvider = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState([])
  
  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewed')
    if (stored) setRecentlyViewed(JSON.parse(stored))
  }, [])
  
  const addToRecentlyViewed = (product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p._id !== product._id)
      return [product, ...filtered].slice(0, 20)
    })
  }
  
  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed))
  }, [recentlyViewed])
  
  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

// Notification Provider
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const { user } = useContext(AuthContext)

  const fetchNotifications = async () => {
    if (!user) { setNotifications([]); return }
    try {
      const data = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json())
      if (data.success) setNotifications(data.data.notifications || [])
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    if (!user) return
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?._id])

  const addNotification = notification => setNotifications(previous => [{ ...notification, _id: `local-${Date.now()}`, read: false, createdAt: new Date() }, ...previous])
  const markAsRead = async id => {
    setNotifications(previous => previous.map(item => String(item._id || item.id) === String(id) ? { ...item, read: true } : item))
    if (!String(id).startsWith('local-')) fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).catch(() => {})
  }
  const clearAll = async () => {
    setNotifications(previous => previous.map(item => ({ ...item, read: true })))
    fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).catch(() => {})
  }

  return <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, fetchNotifications }}>{children}</NotificationContext.Provider>
}

// Chat Provider for Buyer-Seller-Admin communication
const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const { user } = useContext(AuthContext)
  
  const fetchChats = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/chat/chats`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setChats(data.data.chats || [])
    } catch {}
  }
  
  const sendMessage = async (recipientId, message, type = 'buyer_to_seller', productId = null) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return { success: false, message: 'Please sign in first' }
    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId, message, type, productId })
      })
      return await res.json()
    } catch {
      return { success: false, message: 'Unable to send message' }
    }
  }
  
  useEffect(() => {
    if (user) fetchChats()
  }, [user])
  
  return (
    <ChatContext.Provider value={{ chats, activeChat, setActiveChat, fetchChats, sendMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

// Recently Viewed Context (temp)
const RecentlyViewedContext = createContext()

const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, shipping: 0, total: 0, shippingIsEstimate: true })
  
  const fetchCart = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) { 
        setItems(data.data.cart?.items || [])
        setSummary(data.data.summary || { itemCount: 0, subtotal: 0, shipping: 0, total: 0, shippingIsEstimate: true })
      }
    } catch {}
  }
  
  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return { success: false, message: 'Please login first' }
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ productId, quantity }) 
      })
      const data = await res.json()
      if (data.success) { 
        setItems(data.data.cart.items)
        setSummary(data.data.summary)
        return { success: true } 
      }
      return { success: false, message: data.message }
    } catch { return { success: false, message: 'Cannot connect to server' } }
  }
  
  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const data = await res.json()
      if (data.success) { 
        setItems(data.data.cart.items)
        setSummary(data.data.summary)
      }
    } catch {}
  }
  
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) { removeFromCart(productId); return }
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${API_URL}/api/cart/update`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ productId, quantity }) 
      })
      const data = await res.json()
      if (data.success) { 
        setItems(data.data.cart.items)
        setSummary(data.data.summary)
      }
    } catch {}
  }
  
  const clearCart = async () => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch(`${API_URL}/api/cart/clear`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setItems([])
      setSummary({ itemCount: 0, subtotal: 0, shipping: 0, total: 0, shippingIsEstimate: true })
    } catch {}
  }
  
  useEffect(() => {
    if (user?._id) fetchCart()
    else {
      setItems([])
      setSummary({ itemCount: 0, subtotal: 0, shipping: 0, total: 0, shippingIsEstimate: true })
    }
  }, [user?._id])
  
  return (
    <CartContext.Provider value={{ items, summary, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)
const useCart = () => useContext(CartContext)
const useWishlist = () => useContext(WishlistContext)
const useRecentlyViewed = () => useContext(RecentlyViewedContext)
const useNotifications = () => useContext(NotificationContext)
const useChat = () => useContext(ChatContext)

// Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])
  return (
    <div className={`fixed bottom-4 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : type === 'info' ? 'bg-blue-500' : 'bg-gray-800'
    } text-white max-w-sm`}>
      <span className="text-xl">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Announcement Bar
const AnnouncementBar = () => {
  const announcements = [
    '🇳🇬 Shop from verified sellers across Nigeria!',
    '⚡ Discover new deals from local and nationwide stores!',
    '🏪 Turn your products into a nationwide online store!',
    '🛡️ Chat, compare and report issues through one marketplace'
  ]
  const [current, setCurrent] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => setCurrent(prev => (prev + 1) % announcements.length), 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 text-center text-sm font-medium">
      <span className="animate-pulse">🔥</span> {announcements[current]}
    </div>
  )
}

// Notification Bell
const NotificationBell = () => {
  const { notifications, markAsRead, clearAll } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-white hover:bg-orange-600 rounded-full transition-colors">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            <div className="flex gap-2"><button onClick={clearAll} className="text-xs text-orange-600">Mark all read</button><button onClick={() => setOpen(false)} className="text-gray-500">✕</button></div>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">🔔</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map(n => (
                <div key={n._id || n.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-orange-50' : ''}`} onClick={() => { markAsRead(n._id || n.id); if (n.link) { setOpen(false); navigate(n.link) } }}>
                  {n.title && <p className="text-xs font-bold text-orange-600 mb-1">{n.title}</p>}
                  <p className="text-sm font-medium text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Countdown Timer Component
const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const diff = end - now
      
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 }
      
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      }
    }
    
    setTimeLeft(calculate())
    const interval = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(interval)
  }, [endTime])
  
  return (
    <div className="flex items-center gap-1">
      {[
        { value: timeLeft.hours, label: 'H' },
        { value: timeLeft.minutes, label: 'M' },
        { value: timeLeft.seconds, label: 'S' }
      ].map(({ value, label }, i) => (
        <div key={label} className="flex items-center">
          <span className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm">
            {String(value).padStart(2, '0')}
          </span>
          {i < 2 && <span className="text-red-600 font-bold mx-1">:</span>}
        </div>
      ))}
    </div>
  )
}

// Star Rating Component
const StarRating = ({ rating, reviewCount, size = 'md', interactive = false, onRate }) => {
  const [hover, setHover] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating)
  
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => {
              if (interactive) {
                setCurrentRating(star)
                onRate?.(star)
              }
            }}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${sizes[size]} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <span className={
              (interactive ? hover || currentRating : currentRating) >= star 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            }>
              ★
            </span>
          </button>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-gray-500 text-sm">({reviewCount} reviews)</span>
      )}
      <span className="font-bold text-gray-800">{currentRating.toFixed(1)}</span>
    </div>
  )
}

// Review Modal
const ReviewModal = ({ isOpen, onClose, productId, onSubmit }) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [aspectRatings, setAspectRatings] = useState({ quality: 5, delivery: 5, communication: 5 })
  
  if (!isOpen) return null
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, title, comment, aspectRatings })
      })
      const data = await response.json()
      setLoading(false)
      if (!data.success) {
        setToast({ message: data.message || 'Unable to submit review', type: 'error' })
        return
      }
      setToast({ message: '✓ Review submitted successfully!', type: 'success' })
      setTimeout(() => {
        onSubmit?.({ rating, title, comment, aspectRatings, isVerified: data.data?.review?.isVerified })
        onClose()
      }, 900)
    } catch {
      setLoading(false)
      setToast({ message: 'Unable to connect to the server', type: 'error' })
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">⭐ Write a Review</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Overall Rating *</label>
            <StarRating rating={rating} size="lg" interactive onRate={setRating} />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'quality', label: 'Product Quality' },
              { key: 'delivery', label: 'Delivery' },
              { key: 'communication', label: 'Communication' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 mb-1 block">{label}</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setAspectRatings({...aspectRatings, [key]: s})}
                      className={`text-sm ${aspectRatings[key] >= s ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Review Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" 
              placeholder="Summarize your experience" required />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Your Review *</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" 
              rows={4} placeholder="Share your detailed experience..." required />
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <span className="text-green-600">✓</span>
            <span className="text-xs text-green-700">Reviews linked to delivered orders receive a Verified Purchase badge.</span>
          </div>
          
          <button type="submit" disabled={loading} 
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Wishlist Heart Button
const WishlistButton = ({ product, className = '' }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [toast, setToast] = useState(null)
  const isWishlisted = isInWishlist(product._id)
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (isWishlisted) {
      removeFromWishlist(product._id)
      setToast({ message: 'Removed from wishlist', type: 'info' })
    } else {
      addToWishlist(product)
      setToast({ message: '✓ Added to wishlist!', type: 'success' })
    }
  }
  
  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <button onClick={handleClick} className={`p-2 rounded-full transition-all ${className} ${
        isWishlisted ? 'bg-red-100 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-500'
      }`}>
        <span className="text-xl">{isWishlisted ? '❤️' : '🤍'}</span>
      </button>
    </>
  )
}

// Safe interim checkout confirmation.
// Online card/transfer payments remain disabled until verified Flutterwave live payments are approved and enabled.
const PaymentModal = ({ isOpen, onClose, amount, orderId, orderItems, onSuccess }) => {
  if (!isOpen) return null
  const sellerNames = [...new Set((orderItems || []).map(item => item?.sellerName || item?.seller?.sellerProfile?.storeName || item?.seller?.name).filter(Boolean))]

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
        <h2 id="order-confirmation-title" className="text-2xl font-bold text-gray-900 text-center">Order placed successfully</h2>
        <p className="text-sm text-gray-500 text-center mt-2">Order #{orderId?.slice(-8).toUpperCase()}</p>

        <div className="my-5 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-sm font-bold text-orange-900">Temporary payment method: Pay on Delivery</p>
          <p className="text-xs text-orange-800 mt-2 leading-relaxed">
            Online card, USSD and bank-transfer payments are not active yet. Do not transfer money to any account shown outside the official Flutterwave checkout. Confirm the item and seller before paying on delivery.
          </p>
        </div>

        <div className="space-y-2 text-sm bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between gap-4"><span className="text-gray-500">Order total</span><span className="font-bold text-gray-900">₦{amount?.toLocaleString()}</span></div>
          {sellerNames.length > 0 && <div className="flex justify-between gap-4"><span className="text-gray-500">Seller(s)</span><span className="font-medium text-right">{sellerNames.join(', ')}</span></div>}
          <div className="flex justify-between gap-4"><span className="text-gray-500">Payment</span><span className="font-medium text-green-700">On delivery</span></div>
        </div>

        <div className="mt-5 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          🛡️ Never share your OTP, PIN or card details with a seller. Report suspicious requests through support.
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={onClose} className="py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Continue shopping</button>
          <button onClick={() => { onSuccess?.(); onClose() }} className="py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">View my orders</button>
        </div>
      </div>
    </div>
  )
}

// Order Tracking Component
const OrderTracker = ({ status }) => {
  const stages = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'processing', label: 'Processing', icon: '📦' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🏠' }
  ]
  
  const currentIndex = stages.findIndex(s => s.key === status)
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-bold text-gray-800 mb-4">📍 Order Tracking</h3>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              index <= currentIndex 
                ? status === 'cancelled' && index === currentIndex 
                  ? 'bg-red-500 text-white' 
                  : 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {index < currentIndex ? '✓' : stage.icon}
            </div>
            <span className={`text-xs mt-2 ${index <= currentIndex ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
              {stage.label}
            </span>
            {index < stages.length - 1 && (
              <div className={`h-1 w-12 sm:w-20 mt-2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// AI-first support with explicit escalation to an admin or moderator
const SupportChat = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 'welcome', from: 'ai', text: 'Hi! I’m the Campus Market AI Assistant. I can help with orders, selling, delivery, payments and safety. If I cannot solve it, tap “Talk to a person” and I’ll send the conversation to an admin or moderator.', time: new Date() }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [escalating, setEscalating] = useState(false)
  const [toast, setToast] = useState(null)

  const quickReplies = ['Track my order', 'Delivery question', 'Payment safety', 'How to sell', 'Report a problem']

  const getAIResponse = (message) => {
    const text = message.toLowerCase()
    if (text.includes('track') || text.includes('where is my order')) return 'Open My Orders from your profile menu. The tracker shows Pending → Confirmed → Processing → Shipped → Delivered. If the status has not changed for too long, I can send the order issue to a person.'
    if (text.includes('refund') || text.includes('return') || text.includes('wrong item') || text.includes('damage')) return 'Open My Orders and choose “Report Issue / Request Refund.” Add a clear explanation and keep photos or delivery evidence. Automatic online refunds are not active during Pay on Delivery, but an admin can review and mediate the report.'
    if (text.includes('payment') || text.includes('transfer') || text.includes('account') || text.includes('kyc')) return 'Campus Market currently uses Pay on Delivery while verified Flutterwave payment is being prepared. Do not transfer to an account from a screenshot or chat, and never share your OTP, PIN or CVV.'
    if (text.includes('sell') || text.includes('seller') || text.includes('product')) return 'Create a seller account, choose a separate store name and wait for approval. After approval, open Seller Dashboard from your profile menu and upload 1–6 clear product images, delivery prices and an accurate description.'
    if (text.includes('delivery') || text.includes('shipping') || text.includes('state')) return 'Each seller enters a local delivery price and a nationwide price. Your final estimate depends on the seller location and your delivery state. For interstate orders, ask for tracked delivery.'
    if (text.includes('scam') || text.includes('fraud') || text.includes('report') || text.includes('threat')) return 'Do not pay or share private codes. Save evidence, report the order, and tap “Talk to a person” below so an admin or moderator can investigate the full conversation.'
    if (text.includes('hello') || text.includes('hi') || text.includes('help')) return 'Hello! Choose a quick topic below or describe what happened. I’ll try to solve it first, and a human support option is always available.'
    return 'I’m not fully certain about that specific issue. You can rephrase it with the order or product details, or tap “Talk to a person” so an admin or moderator receives this conversation.'
  }

  const addMessage = (from, text, id = `${from}-${Date.now()}-${Math.random()}`) => setMessages(current => current.some(message => message.id === id) ? current : [...current, { id, from, text, time: new Date() }])

  const sendToHumanTicket = async (text) => {
    if (!ticket?._id) return false
    const res = await fetch(`${API_URL}/api/support/tickets/${ticket._id}/reply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ message: text })
    })
    const data = await res.json()
    return Boolean(data.success)
  }

  const handleSend = async (preset) => {
    const text = typeof preset === 'string' ? preset : newMessage
    if (!text.trim()) return
    addMessage('user', text.trim())
    setNewMessage('')

    if (ticket) {
      try {
        const sent = await sendToHumanTicket(text.trim())
        if (!sent) addMessage('system', 'That message could not reach human support. Please try again.')
      } catch { addMessage('system', 'Connection problem. Your message was not sent to human support.') }
      return
    }

    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      addMessage('ai', getAIResponse(text))
    }, 650)
  }

  const escalateToHuman = async () => {
    if (!user) {
      addMessage('system', 'Please sign in first so support can identify your account and reply securely.')
      setToast({ message: 'Sign in to talk to an admin or moderator', type: 'info' })
      return
    }
    setEscalating(true)
    const transcript = messages.map(message => `${message.from.toUpperCase()}: ${message.text}`).join('\n\n')
    try {
      const res = await fetch(`${API_URL}/api/support/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ subject: 'AI Support Escalation', message: transcript, priority: 'normal' })
      })
      const data = await res.json()
      setEscalating(false)
      if (data.success) {
        setTicket(data.data.ticket)
        addMessage('system', `Conversation sent to human support. Ticket #${data.data.ticket._id.slice(-6).toUpperCase()}. New messages in this chat now go to an admin or moderator.`)
      } else addMessage('system', data.message || 'Unable to contact human support right now.')
    } catch {
      setEscalating(false)
      addMessage('system', 'Unable to connect to human support. Please try again shortly.')
    }
  }

  useEffect(() => {
    if (!open || !ticket || !user) return
    const checkReplies = async () => {
      try {
        const data = await fetch(`${API_URL}/api/support/tickets/my`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(response => response.json())
        const updated = data.data?.tickets?.find(item => item._id === ticket._id)
        if (updated) {
          setTicket(updated)
          ;(updated.replies || []).filter(reply => reply.from?._id !== user._id && reply.from !== user._id).forEach(reply => addMessage('human', `${reply.from?.name || 'Support'}: ${reply.message}`, `reply-${reply._id}`))
        }
      } catch {}
    }
    checkReplies()
    const interval = setInterval(checkReplies, 12000)
    return () => clearInterval(interval)
  }, [open, ticket?._id, user?._id])

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {open && <div className="bg-white rounded-2xl shadow-2xl w-[min(24rem,calc(100vw-2rem))] mb-3 border border-gray-200 overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-r from-gray-950 to-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl ${ticket ? 'bg-green-500' : 'bg-orange-500'}`}>{ticket ? '👩🏽‍💻' : '🤖'}</span><div><p className="font-bold">{ticket ? 'Human Support' : 'AI Support Assistant'}</p><p className="text-xs text-gray-300">{ticket ? `Ticket #${ticket._id.slice(-6).toUpperCase()} • ${ticket.status}` : 'Instant help • human backup available'}</p></div></div>
          <button onClick={() => setOpen(false)} className="text-white text-xl" aria-label="Close support">✕</button>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50" aria-live="polite">
          {messages.map(message => <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] p-3 rounded-2xl text-sm shadow-sm ${message.from === 'user' ? 'bg-orange-500 text-white rounded-br-sm' : message.from === 'human' ? 'bg-green-600 text-white rounded-bl-sm' : message.from === 'system' ? 'bg-blue-50 border border-blue-200 text-blue-800 mx-auto text-xs' : 'bg-white border text-gray-800 rounded-bl-sm'}`}>{message.text}</div></div>)}
          {typing && <div className="inline-flex gap-1 bg-white border rounded-2xl px-4 py-3"><span className="animate-pulse">●</span><span className="animate-pulse">●</span><span className="animate-pulse">●</span></div>}
        </div>

        <div className="p-3 border-t bg-white">
          {!ticket && <div className="flex flex-wrap gap-1.5 mb-3">{quickReplies.map(reply => <button key={reply} onClick={() => handleSend(reply)} className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-700 rounded-full">{reply}</button>)}</div>}
          {!ticket && <button onClick={escalateToHuman} disabled={escalating} className="w-full mb-3 py-2.5 border border-green-300 bg-green-50 text-green-800 font-bold rounded-xl text-sm hover:bg-green-100 disabled:opacity-50">{escalating ? 'Sending conversation...' : '👩🏽‍💻 Talk to a person'}</button>}
          <div className="flex gap-2"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={ticket ? 'Message human support...' : 'Ask the AI assistant...'} className="min-w-0 flex-1 px-4 py-2.5 border rounded-full text-sm outline-none focus:border-orange-500" /><button onClick={() => handleSend()} className="w-11 h-11 bg-orange-500 text-white rounded-full hover:bg-orange-600" aria-label="Send message">➤</button></div>
          <p className="text-[10px] text-gray-400 text-center mt-2">Never share passwords, OTPs, PINs or CVVs in support chat.</p>
        </div>
      </div>}
      <button onClick={() => setOpen(!open)} className="relative w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-105" aria-label="Open support chat">{open ? '✕' : ticket ? '👩🏽‍💻' : '🤖'}{!open && <span className="absolute -top-1 -right-1 bg-green-500 border-2 border-white w-5 h-5 rounded-full" />}</button>
    </div>
  )
}

// Shared buyer/seller message inbox
const MessagesPage = () => {
  const { user } = useAuth()
  const { chats, fetchChats, sendMessage } = useChat()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchChats()
    const interval = setInterval(fetchChats, 15000)
    return () => clearInterval(interval)
  }, [user?._id])

  useEffect(() => {
    if (!activeId && chats?.length) setActiveId(chats[0]._id)
  }, [chats, activeId])

  if (!user) return null
  const activeChat = (chats || []).find(chat => chat._id === activeId)
  const otherPerson = activeChat?.participants?.find(person => String(person._id) !== String(user._id))

  const handleReply = async () => {
    if (!message.trim() || !otherPerson || sending) return
    setSending(true)
    const result = await sendMessage(otherPerson._id, message.trim(), activeChat.type || 'buyer_to_seller', activeChat.product?._id)
    setSending(false)
    if (result?.success) {
      setMessage('')
      await fetchChats()
    } else setToast({ message: result?.message || 'Unable to send message', type: 'error' })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-5 sm:py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-5"><div><h1 className="text-2xl font-black text-gray-900">💬 Messages</h1><p className="text-sm text-gray-500">Buyer–seller product conversations stay here for easy follow-up and safety.</p></div><button onClick={fetchChats} className="text-xs bg-white border px-3 py-2 rounded-lg">↻ Refresh</button></div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[620px]">
          <aside className="border-r bg-gray-50 max-h-[620px] overflow-y-auto">
            <div className="p-4 border-b bg-white"><p className="font-bold text-sm">Conversations ({chats?.length || 0})</p></div>
            {(chats || []).length ? chats.map(chat => {
              const person = chat.participants?.find(item => String(item._id) !== String(user._id))
              const last = chat.messages?.[chat.messages.length - 1]
              return <button key={chat._id} onClick={() => setActiveId(chat._id)} className={`w-full p-4 text-left border-b hover:bg-white ${activeId === chat._id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}><div className="flex gap-3"><div className="w-10 h-10 flex-shrink-0 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold">{(person?.sellerProfile?.storeName || person?.name || 'U').charAt(0)}</div><div className="min-w-0"><p className="font-bold text-sm truncate">{person?.sellerProfile?.storeName || person?.name || 'Marketplace user'}</p><p className="text-xs text-gray-500 truncate">{chat.product?.title || 'Product conversation'}</p><p className="text-xs text-gray-400 truncate mt-1">{last?.message || 'No message'}</p></div></div></button>
            }) : <div className="p-8 text-center text-gray-500"><span className="text-4xl block">💬</span><p className="font-bold mt-3">No conversations yet</p><p className="text-xs mt-1">Open a product and choose Chat with Seller.</p><button onClick={() => navigate('/products')} className="mt-4 text-orange-600 font-bold text-sm">Browse products</button></div>}
          </aside>

          <section className="flex flex-col min-w-0">
            {activeChat ? <>
              <div className="p-4 border-b flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-bold text-gray-900 truncate">{otherPerson?.sellerProfile?.storeName || otherPerson?.name}</p><button onClick={() => activeChat.product?._id && navigate(`/products/${activeChat.product._id}`)} className="text-xs text-orange-600 truncate max-w-full">Re: {activeChat.product?.title || 'Product'} →</button></div><span className="text-xs text-green-600">● Conversation open</span></div>
              <div className="flex-1 p-4 sm:p-6 space-y-3 overflow-y-auto bg-gray-50 max-h-[450px]">{(activeChat.messages || []).map((item, index) => { const mine = String(item.sender?._id || item.sender) === String(user._id); return <div key={item._id || index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] p-3 rounded-2xl text-sm ${mine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white border text-gray-800 rounded-bl-sm'}`}><p>{item.message}</p><p className={`text-[10px] mt-1 ${mine ? 'text-orange-100' : 'text-gray-400'}`}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p></div></div>})}</div>
              <div className="p-4 border-t"><div className="flex gap-2"><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleReply() }} rows={2} maxLength={2000} placeholder="Type your reply..." className="min-w-0 flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" /><button onClick={handleReply} disabled={sending || !message.trim()} className="px-5 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-50">{sending ? '...' : 'Send'}</button></div><p className="text-[10px] text-gray-400 mt-2">Keep discussions respectful. Never send passwords, OTPs or card PINs.</p></div>
            </> : <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-8"><div><span className="text-5xl">💬</span><p className="mt-3">Select a conversation</p></div></div>}
          </section>
        </div>
      </div>
    </div>
  )
}

// Product-to-seller chat is visible to everyone; sign-in is required only when opening it.
const ProductChat = ({ sellerId, productTitle, productId }) => {
  const { user } = useAuth()
  const { chats, fetchChats, sendMessage } = useChat()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)
  const conversation = (chats || []).find(chat => String(chat.product?._id || chat.product) === String(productId) && chat.participants?.some(person => String(person._id || person) === String(sellerId)))

  const openChat = async () => {
    if (!user) {
      sessionStorage.setItem('returnAfterLogin', window.location.pathname)
      navigate('/login')
      return
    }
    await fetchChats()
    setOpen(true)
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    const result = await sendMessage(sellerId, message.trim(), 'buyer_to_seller', productId)
    setSending(false)
    if (result?.success) {
      setToast({ message: '✓ Message sent to seller!', type: 'success' })
      setMessage('')
      await fetchChats()
    } else setToast({ message: result?.message || 'Unable to send message', type: 'error' })
  }

  if (user?._id && String(user._id) === String(sellerId)) {
    return <div className="mt-4 text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">🏪 This is your own listing</div>
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <button onClick={openChat} className="mt-4 w-full sm:w-auto px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm">
        💬 Chat with Seller
      </button>
      {!user && <p className="text-[11px] text-gray-500 mt-1">Sign in to ask the seller about this product.</p>}

      {open && <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">💬 Chat with Seller</h3><p className="text-xs text-gray-500 mt-1">Re: {productTitle}</p></div><button onClick={() => setOpen(false)} className="text-gray-500 text-xl">✕</button></div>
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg mb-3">Keep product questions and agreements in this chat so support can review them if a problem is reported.</div>
          <div className="h-52 overflow-y-auto bg-gray-50 border rounded-xl p-3 space-y-2 mb-3">
            {conversation?.messages?.length ? conversation.messages.map((item, index) => { const mine = String(item.sender?._id || item.sender) === String(user?._id); return <div key={item._id || index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border text-gray-800 rounded-bl-sm'}`}><p>{item.message}</p>{item.createdAt && <p className={`text-[9px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(item.createdAt).toLocaleString()}</p>}</div></div> }) : <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs"><div><span className="text-3xl block">💬</span>No previous messages about this product.<br />Start the conversation below.</div></div>}
          </div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSend() }} className="w-full px-4 py-3 border rounded-xl mb-2 text-sm focus:border-blue-500 outline-none" rows={3} maxLength={2000} placeholder="Ask about condition, availability, delivery, size, warranty..." />
          <div className="flex items-center justify-between gap-2 mb-4"><p className="text-[10px] text-gray-400">Ctrl + Enter to send • Never share OTPs or PINs.</p><button onClick={() => navigate('/messages')} className="text-[10px] text-blue-600 font-bold">View all conversations →</button></div>
          <div className="flex gap-3"><button onClick={() => setOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">Close</button><button onClick={handleSend} disabled={sending || !message.trim()} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">{sending ? 'Sending...' : 'Send Message'}</button></div>
        </div>
      </div>}
    </div>
  )
}

// Header with discoverable categories and a role-aware profile dropdown
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { summary } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const currentCategory = new URLSearchParams(location.search).get('category') || ''

  useEffect(() => {
    setProfileMenuOpen(false)
    setCategoriesOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(searchQuery.trim() ? `/products?search=${encodeURIComponent(searchQuery.trim())}` : '/products')
  }

  const handleLogout = () => {
    setProfileMenuOpen(false)
    logout()
    setToast({ message: 'Logged out successfully', type: 'success' })
  }

  const go = path => { setProfileMenuOpen(false); navigate(path) }

  const accountDropdown = profileMenuOpen && isAuthenticated && (
    <>
      <button aria-label="Close account menu" onClick={() => setProfileMenuOpen(false)} className="fixed inset-0 z-[70] bg-black/10" />
      <div className="fixed z-[80] right-3 sm:right-6 top-28 sm:top-32 w-[min(22rem,calc(100vw-1.5rem))] max-h-[calc(100vh-8rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 animate-fade-in">
        <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-orange-600 rounded-full flex items-center justify-center text-xl font-black">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="min-w-0"><p className="font-bold truncate">{user?.name}</p><p className="text-xs text-orange-100 truncate">{user?.email}</p><span className="inline-block text-[10px] uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full mt-1">{user?.role}</span></div>
          </div>
        </div>
        <div className="p-2">
          <button onClick={() => go('/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-left text-sm"><span className="text-xl">👤</span><span><strong className="block">My Profile</strong><span className="text-xs text-gray-500">Personal information and security</span></span></button>
          <button onClick={() => go('/orders')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-left text-sm"><span className="text-xl">📦</span><span><strong className="block">My Orders</strong><span className="text-xs text-gray-500">Track purchases and report issues</span></span></button>
          <button onClick={() => go('/wishlist')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-left text-sm"><span className="text-xl">❤️</span><span><strong className="block">Wishlist</strong><span className="text-xs text-gray-500">{wishlist.length} saved product(s)</span></span></button>
          <button onClick={() => go('/messages')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-left text-sm"><span className="text-xl">💬</span><span><strong className="block">Messages</strong><span className="text-xs text-gray-500">Chat with buyers and sellers</span></span></button>
          {(user?.role === 'seller' || user?.role === 'admin') && <button onClick={() => go('/seller')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-left text-sm text-orange-800"><span className="text-xl">🏪</span><span><strong className="block">Seller Dashboard</strong><span className="text-xs text-orange-600">Products, images, orders and wallet</span></span></button>}
          {(user?.role === 'admin' || user?.role === 'moderator') && <button onClick={() => go('/admin')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-left text-sm text-purple-800"><span className="text-xl">🛡️</span><span><strong className="block">{user.role === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}</strong><span className="text-xs text-purple-600">Approvals, reports and human support</span></span></button>}
          <div className="border-t my-2" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-left text-sm text-red-600"><span className="text-xl">↪</span><strong>Sign Out</strong></button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {accountDropdown}
      <AnnouncementBar />
      <header className="bg-white shadow-sm sticky top-0 z-40 relative">
        <div className="hidden md:block bg-gray-900 text-white">
          <div className="px-4 py-2 flex justify-between items-center max-w-7xl mx-auto text-xs">
            <div className="flex items-center gap-4"><span>📞 09051103883</span><span>🚚 Local and nationwide delivery</span><span>🛡️ Reviewed listings and support</span></div>
            <div>{isAuthenticated ? <span>Welcome, {user?.name}</span> : <div className="flex gap-4"><Link to="/login">Sign In</Link><Link to="/register">Join Free</Link></div>}</div>
          </div>
        </div>

        <div className="bg-orange-500">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white text-2xl w-9" aria-label="Open menu">{mobileMenuOpen ? '✕' : '☰'}</button>
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="bg-white rounded-xl w-11 h-11 sm:w-12 sm:h-12 p-1.5 shadow flex items-center justify-center"><img src="/logo.svg" alt="Campus Market" className="w-full h-full object-contain" /></span>
              <span className="hidden sm:block text-white leading-tight"><strong className="text-lg block">Campus</strong><span className="text-xs text-orange-100">Market</span></span>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex bg-white rounded-xl overflow-hidden shadow-sm">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products, stores, brands..." className="min-w-0 flex-1 px-3 sm:px-4 py-3 text-sm outline-none" />
                <button className="px-4 sm:px-6 bg-red-600 hover:bg-red-700 text-white font-bold" aria-label="Search">🔍</button>
              </div>
            </form>

            <div className="flex items-center gap-1 sm:gap-3">
              <Link to="/wishlist" className="hidden sm:flex relative w-10 h-10 items-center justify-center text-white text-xl" aria-label="Wishlist">❤️{wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-700 text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{wishlist.length}</span>}</Link>
              <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center text-white text-xl" aria-label="Cart">🛒{summary.itemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-700 text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{summary.itemCount}</span>}</Link>
              {isAuthenticated && <NotificationBell />}
              {isAuthenticated ? <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="w-10 h-10 bg-white rounded-full text-orange-600 font-black shadow flex items-center justify-center" aria-label="Open account menu">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</button> : <Link to="/login" className="hidden sm:block px-4 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm">Sign In</Link>}
            </div>
          </div>
        </div>

        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-1 overflow-x-auto min-w-0">
            <button onClick={() => setCategoriesOpen(!categoriesOpen)} className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap ${categoriesOpen ? 'bg-orange-50 text-orange-700' : 'text-gray-800 hover:text-orange-600'}`}>☰ All Categories</button>
            <Link to="/products" className={`px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${!currentCategory ? 'text-orange-600 border-orange-600' : 'text-gray-600 border-transparent'}`}>All Products</Link>
            {MARKET_CATEGORIES.slice(0, 6).map(category => <button key={category.slug} onClick={() => navigate(`/products?category=${category.slug}`)} className={`px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${currentCategory === category.slug ? 'text-orange-600 border-orange-600' : 'text-gray-600 border-transparent hover:text-orange-600'}`}>{category.icon} {category.short}</button>)}
            <button onClick={() => navigate('/products?flash=true')} className="px-3 py-3 text-xs sm:text-sm font-bold whitespace-nowrap text-red-600">⚡ Deals</button>
          </div>
        </nav>

        {categoriesOpen && <div className="absolute left-0 right-0 top-full bg-white border-t shadow-2xl z-50">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-gray-900">Explore all categories</h2><p className="text-xs text-gray-500">Find products even when you are not sure what to search for</p></div><button onClick={() => setCategoriesOpen(false)} className="text-gray-500 text-xl">✕</button></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">{MARKET_CATEGORIES.map(category => <button key={category.slug} onClick={() => navigate(`/products?category=${category.slug}`)} className="p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-left flex gap-3"><span className="text-2xl">{category.icon}</span><span><strong className="text-sm block text-gray-900">{category.name}</strong><span className="text-[11px] text-gray-500 line-clamp-2">{category.description}</span></span></button>)}</div>
          </div>
        </div>}

        {mobileMenuOpen && <div className="md:hidden bg-white border-t p-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 mb-3">{MARKET_CATEGORIES.map(category => <button key={category.slug} onClick={() => navigate(`/products?category=${category.slug}`)} className="p-3 bg-gray-50 rounded-lg text-left text-xs">{category.icon} {category.name}</button>)}</div>
          <div className="border-t pt-3 flex gap-3 text-sm"><Link to="/about">About</Link><Link to="/safety">Safety</Link><Link to="/returns">Returns</Link></div>
        </div>}
      </header>
    </>
  )
}

// Product Card with all features
const ProductCard = ({ product, showFlashDeal = false }) => {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isInWishlist } = useWishlist()
  const { addToRecentlyViewed } = useRecentlyViewed()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [isHovered, setIsHovered] = useState(false)

  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  
  useEffect(() => {
    if (isHovered) addToRecentlyViewed(product)
  }, [isHovered])

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    const result = await addToCart(product._id)
    if (result?.success) setToast({ message: '✓ Added to cart!', type: 'success' })
    else setToast({ message: result?.message || 'Failed', type: 'error' })
  }

  const handleQuickView = (e) => {
    e.stopPropagation()
    navigate(`/products/${product._id}`)
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative group"
        onClick={() => navigate(`/products/${product._id}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton product={product} />
        </div>
        
        {/* Flash Deal Badge */}
        {showFlashDeal && discount > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">⚡ -{discount}%</div>
          </div>
        )}
        
        {/* Pending Approval Badge */}
        {!product.isApproved && user?.role === 'seller' && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">⏳</div>
          </div>
        )}
        
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          <ProductImage product={product} alt={product.title} className="group-hover:scale-105 transition-transform duration-500" />
          {product.images?.length > 1 && (
            <span className="absolute bottom-2 left-2 bg-black/65 text-white text-[10px] px-2 py-1 rounded-full">📷 {product.images.length}</span>
          )}
          
          {/* Quick Actions on Hover */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button onClick={handleQuickView} className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-bold hover:bg-orange-500 hover:text-white transition-colors">
              👁️ Quick View
            </button>
          </div>
        </div>
        
        <div className="p-2 sm:p-3">
          <div className="mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl font-bold" style={{ color: colors.primary }}>
              ₦{product.price?.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through ml-1 sm:ml-2">
                ₦{product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>
          
          <h3 className="text-xs sm:text-sm text-gray-800 line-clamp-2 mb-1 sm:mb-2 hover:text-orange-600">
            {product.title}
          </h3>
          
          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={product.rating || 0} reviewCount={product.reviewCount || 0} size="sm" />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-xs text-gray-500">
            <span className="truncate max-w-full">{product.seller?.sellerProfile?.storeName || product.seller?.name}</span>
            <span className="text-green-600">✓</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 mb-2 sm:mb-3 min-w-0">
            <span className="truncate">📍 {product.location || 'Nigeria'}</span>
            <span>•</span>
            <span>{product.views || 0} views</span>
            {product.stock <= 5 && product.stock > 0 && <span className="text-red-500">• {product.stock} left</span>}
          </div>
          
          <button onClick={handleAddToCart} disabled={product.stock < 1}
            className="w-full py-2 bg-orange-500 text-white text-xs sm:text-sm font-bold rounded hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
            {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </>
  )
}

// Loading Skeleton
const LoadingSkeleton = ({ count = 10 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg h-72 sm:h-80 animate-pulse"></div>
    ))}
  </div>
)

// Recently Viewed Section
const RecentlyViewedSection = () => {
  const { recentlyViewed } = useRecentlyViewed()
  
  if (recentlyViewed.length === 0) return null
  
  return (
    <div className="py-6 sm:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">👁️ Recently Viewed</h2>
          <Link to="/products" className="text-orange-600 font-medium hover:underline text-sm">View All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {recentlyViewed.slice(0, 5).map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </div>
  )
}

// Flash Deals Section with Countdown
const FlashDealsSection = ({ products }) => {
  const navigate = useNavigate()
  const endTime = new Date()
  endTime.setHours(endTime.getHours() + 8)
  
  return (
    <div className="py-6 sm:py-8 bg-gradient-to-r from-red-600 to-orange-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white text-red-600 px-4 py-2 rounded font-bold flex items-center gap-2">
              <span className="text-xl">⚡</span> FLASH DEALS
            </div>
            <div className="text-white">
              <span className="text-sm">Ends in:</span>
              <CountdownTimer endTime={endTime} />
            </div>
          </div>
          <button onClick={() => navigate('/products?flash=true')} className="text-white font-medium hover:underline text-sm flex items-center gap-1">
            View All <span>→</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
          {products.map(p => <ProductCard key={p._id} product={p} showFlashDeal />)}
        </div>
      </div>
    </div>
  )
}

// Home Page with Background Image for Hero
const HomePage = () => {
  const [products, setProducts] = useState([])
  const [flashDeals, setFlashDeals] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/products?limit=20`).then(r => r.json()),
      fetch(`${API_URL}/api/products/flash-deals`).then(r => r.json()),
      fetch(`${API_URL}/api/products?category=phones-accessories&limit=4`).then(r => r.json()),
      fetch(`${API_URL}/api/products?category=electronics&limit=4`).then(r => r.json()),
      fetch(`${API_URL}/api/products?category=furniture&limit=4`).then(r => r.json()),
      fetch(`${API_URL}/api/products?category=fashion&limit=4`).then(r => r.json()),
      fetch(`${API_URL}/api/products?category=kitchen-home&limit=4`).then(r => r.json()),
    ]).then(([productsData, dealsData, phonesData, electronicsData, furnitureData, fashionData, homeData]) => {
      if (productsData.success) setProducts(productsData.data.products)
      if (dealsData.success) setFlashDeals(dealsData.data.products)
      setCategoryProducts({
        'phones-accessories': phonesData.data?.products || [],
        'electronics': electronicsData.data?.products || [],
        'furniture': furnitureData.data?.products || [],
        'fashion': fashionData.data?.products || [],
        'kitchen-home': homeData.data?.products || [],
      })
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Nationwide marketplace hero with a real responsive background image */}
      <section
        className="hero-photo relative overflow-hidden min-h-[520px] sm:min-h-[580px] flex items-center"
        style={{ backgroundImage: "url('/hero-marketplace.jpg')" }}
        aria-label="Campus Market nationwide shopping marketplace"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1026]/95 via-[#111827]/80 to-[#111827]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 py-12 sm:py-16">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-5">
              🇳🇬 Built for campus. Open to everyone across Nigeria.
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              Discover trusted products from sellers near you
            </h1>
            <p className="text-sm sm:text-lg text-gray-200 mt-5 max-w-xl leading-relaxed">
              Shop phones, fashion, electronics, home essentials and more. Compare sellers, chat before buying and get delivery within your state or nationwide.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('heroSearch'); navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products') }} className="mt-7 bg-white p-1.5 rounded-xl shadow-2xl flex max-w-xl">
              <input name="heroSearch" aria-label="Search products" placeholder="What are you looking for?" className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-900 rounded-lg outline-none" />
              <button type="submit" className="px-5 sm:px-7 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg">Search</button>
            </form>

            <div className="flex flex-wrap gap-3 mt-5">
              <button onClick={() => navigate('/products')} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg">🛍️ Shop all products</button>
              {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin') ? (
                <button onClick={() => navigate('/seller')} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl backdrop-blur-sm">📊 Open seller dashboard</button>
              ) : (
                <button onClick={() => navigate(isAuthenticated ? '/profile' : '/register')} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl backdrop-blur-sm">🚀 Start selling</button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl">
              {[
                ['✓', 'Reviewed listings'],
                ['💬', 'Chat with sellers'],
                ['🚚', 'Nationwide delivery'],
                ['🛡️', 'Report & support']
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-7 text-xs">
              <span className="text-gray-300">Popular:</span>
              {[
                ['Phones', 'phones-accessories'], ['Fashion', 'fashion'], ['Electronics', 'electronics'], ['Apartment', 'kitchen-home']
              ].map(([label, category]) => (
                <button key={category} onClick={() => navigate(`/products?category=${category}`)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10">{label}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && <FlashDealsSection products={flashDeals} />}

      {/* Recently Viewed */}
      <RecentlyViewedSection />

      {/* Category Sections */}
      {Object.entries(categoryProducts).map(([category, prods]) => (
        prods.length > 0 && (
          <div key={category} className="py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 capitalize">
                  {`${MARKET_CATEGORIES.find(item => item.slug === category)?.icon || '📦'} ${MARKET_CATEGORIES.find(item => item.slug === category)?.name || category.replace('-', ' ')}`}
                </h2>
                <button onClick={() => navigate(`/products?category=${category}`)} className="text-orange-600 font-medium hover:underline text-sm">
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {prods.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </div>
          </div>
        )
      ))}

      {/* All Products */}
      <div className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">⭐ All Products</h2>
            <button onClick={() => navigate('/products')} className="text-orange-600 font-medium hover:underline text-sm">
              View All →
            </button>
          </div>
          {loading ? <LoadingSkeleton count={10} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Clear onboarding for first-time shoppers and sellers */}
      <section className="py-10 sm:py-14 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div><span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Simple and transparent</span><h2 className="text-2xl sm:text-4xl font-black mt-2">From discovery to delivery</h2><p className="text-gray-300 mt-3 max-w-xl">Campus Market helps buyers find useful products and helps independent sellers present their stores professionally to customers in every state.</p><div className="flex flex-wrap gap-3 mt-6"><button onClick={() => navigate('/products')} className="px-5 py-3 bg-orange-500 font-bold rounded-xl">Start shopping</button><button onClick={() => navigate(isAuthenticated ? '/profile' : '/register')} className="px-5 py-3 border border-white/30 font-bold rounded-xl">Become a seller</button></div></div>
            <div className="grid sm:grid-cols-3 gap-3">{[['1', 'Browse', 'Search or explore clear categories and seller locations.'], ['2', 'Compare', 'Check images, condition, delivery price and chat with the seller.'], ['3', 'Receive', 'Track the order and inspect Pay-on-Delivery items before paying.']].map(([number, title, body]) => <div key={number} className="bg-white/5 border border-white/10 p-5 rounded-2xl"><span className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center font-black">{number}</span><h3 className="font-bold mt-4">{title}</h3><p className="text-xs text-gray-400 mt-2 leading-relaxed">{body}</p></div>)}</div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <div className="py-8 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            🛡️ Why Choose Campus Market
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              ['🇳🇬', 'Nationwide Reach', 'Buy and sell beyond campus'],
              ['📷', 'Clear Listings', 'Multiple images and delivery details'],
              ['✅', 'Reviewed Sellers', 'Seller and listing approval tools'],
              ['💬', 'Direct Communication', 'Chat and report issues in one place']
            ].map(([icon, title, desc]) => (
              <div key={title} className="text-center p-4 sm:p-6 bg-gray-50 rounded-lg">
                <span className="text-3xl sm:text-4xl block mb-2 sm:mb-3">{icon}</span>
                <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Public, shareable seller storefront backed only by real marketplace records
const StorePage = () => {
  const sellerId = window.location.pathname.split('/').pop()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    fetch(`${API_URL}/api/stores/${sellerId}`).then(r => r.json()).then(result => { if (result.success) setData(result.data); setLoading(false) }).catch(() => setLoading(false))
    if (user) fetch(`${API_URL}/api/stores/${sellerId}/follow-status`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).then(result => result.success && setFollowing(result.data.following)).catch(() => {})
  }, [sellerId, user?._id])

  const toggleFollow = async () => {
    if (!user) { sessionStorage.setItem('returnAfterLogin', window.location.pathname); navigate('/login'); return }
    const result = await fetch(`${API_URL}/api/stores/${sellerId}/follow`, { method: following ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json())
    if (result.success) { setFollowing(!following); setData(current => ({ ...current, metrics: { ...current.metrics, followers: Math.max(0, (current.metrics.followers || 0) + (following ? -1 : 1)) } })) }
  }

  const shareStore = async () => {
    const share = { title: `${data?.seller?.sellerProfile?.storeName || data?.seller?.name} on Campus Market`, text: 'Explore this verified Campus Market store.', url: window.location.href }
    try { if (navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(share.url); setToast({ message: 'Store link copied', type: 'success' }) } } catch {}
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-center"><div><span className="text-6xl">🏪</span><h1 className="text-2xl font-bold mt-4">Store not found</h1><button onClick={() => navigate('/products')} className="mt-4 text-orange-600 font-bold">Browse products</button></div></div>
  const { seller, products, metrics } = data
  return <div className="min-h-screen bg-gray-100">
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <section className="relative bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 relative z-10"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div className="flex items-center gap-4"><div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white text-orange-600 flex items-center justify-center text-4xl font-black shadow-xl overflow-hidden">{seller.sellerProfile?.logo ? <img src={seller.sellerProfile.logo} className="w-full h-full object-cover" /> : (seller.sellerProfile?.storeName || seller.name).charAt(0)}</div><div><div className="flex items-center gap-2 flex-wrap"><h1 className="text-2xl sm:text-4xl font-black">{seller.sellerProfile?.storeName || seller.name}</h1><VerificationBadge level={seller.verificationLevel} /></div><p className="text-gray-300 mt-2 max-w-xl">{seller.sellerProfile?.description || 'Independent seller on Campus Market.'}</p><p className="text-xs text-gray-400 mt-2">📍 {seller.address?.state || 'Nigeria'} • Member since {new Date(seller.createdAt).getFullYear()}</p></div></div><div className="flex gap-2"><button onClick={toggleFollow} className={`px-5 py-3 rounded-xl font-bold ${following ? 'bg-white text-gray-800' : 'bg-orange-500 text-white'}`}>{following ? '✓ Following' : '+ Follow Store'}</button><button onClick={shareStore} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl">↗ Share</button></div></div></div>
    </section>
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">{[['Products', metrics.products], ['Delivered sales', metrics.deliveredSales], ['Followers', metrics.followers], ['Verified reviews', metrics.reviews], ['Rating', `${Number(metrics.rating || 0).toFixed(1)}★`]].map(([label,value]) => <div key={label} className="bg-white border rounded-xl p-4 text-center"><p className="text-xl font-black text-gray-900">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>)}</div>
      {(seller.sellerProfile?.returnPolicy || seller.sellerProfile?.pickupAddress) && <div className="grid md:grid-cols-2 gap-3 mb-8">{seller.sellerProfile.returnPolicy && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><h3 className="font-bold text-blue-900">↩ Store return policy</h3><p className="text-sm text-blue-800 mt-2">{seller.sellerProfile.returnPolicy}</p></div>}{seller.sellerProfile.pickupAddress && <div className="bg-green-50 border border-green-200 rounded-xl p-4"><h3 className="font-bold text-green-900">📍 Pickup information</h3><p className="text-sm text-green-800 mt-2">{seller.sellerProfile.pickupAddress}</p></div>}</div>}
      <div className="flex items-center justify-between mb-5"><div><h2 className="text-2xl font-black text-gray-900">Store products</h2><p className="text-sm text-gray-500">{products.length} approved listing(s)</p></div></div>
      {products.length ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">{products.map(product => <ProductCard key={product._id} product={product} />)}</div> : <div className="bg-white p-12 text-center rounded-xl text-gray-500">No active products in this store.</div>}
    </div>
  </div>
}

// Products Page with Advanced Filters
const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [minRating, setMinRating] = useState(0)
  const [locationFilter, setLocationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const flash = searchParams.get('flash') || ''
  const seller = searchParams.get('seller') || ''

  useEffect(() => {
    setLoading(true)
    let url = `${API_URL}/api/products?limit=50`
    if (category) url += `&category=${encodeURIComponent(category)}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (seller) url += `&seller=${encodeURIComponent(seller)}`
    fetch(url).then(r => r.json()).then(d => { 
      if (d.success) setProducts(d.data.products); 
      setLoading(false) 
    }).catch(() => setLoading(false))
  }, [category, search, seller, location.search])

  const filteredProducts = products
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => (p.rating || 0) >= minRating)
    .filter(p => !locationFilter || (p.location || '').toLowerCase().includes(locationFilter.toLowerCase()))
    .filter(p => flash ? p.isFlashDeal : true)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return (a.price || 0) - (b.price || 0)
        case 'price-high': return (b.price || 0) - (a.price || 0)
        case 'rating': return (b.rating || 0) - (a.rating || 0)
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt)
        default: return 0
      }
    })

  const getCategoryName = () => {
    if (search) return `Search: "${search}"`
    if (seller) return products[0]?.seller?.sellerProfile?.storeName ? `Store: ${products[0].seller.sellerProfile.storeName}` : 'Seller Store'
    if (flash) return '⚡ Flash Deals'
    if (category) {
      const meta = MARKET_CATEGORIES.find(item => item.slug === category)
      return meta ? `${meta.icon} ${meta.name}` : category.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    }
    return 'All Products'
  }

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 bg-white p-3 rounded-lg flex-wrap">
          <button onClick={() => navigate('/')} className="hover:text-orange-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-orange-600">Products</button>
          {(category || search) && (
            <><span>/</span><span className="text-gray-800">{getCategoryName()}</span></>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{getCategoryName()}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{filteredProducts.length} products found</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} 
              className="md:hidden px-4 py-2 bg-white border rounded-lg text-sm font-medium">
              ⚙️ Filters
            </button>
            
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border rounded-lg text-sm">
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
        
        {/* Advanced Filters */}
        <div className={`bg-white rounded-lg p-4 mb-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Price:</label>
              <input type="number" placeholder="Min" value={priceRange[0]} onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-24 px-3 py-2 border rounded text-sm" />
              <span>-</span>
              <input type="number" placeholder="Max" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                className="w-24 px-3 py-2 border rounded text-sm" />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Seller location:</label>
              <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Lagos, Osun, Abuja..." className="w-44 px-3 py-2 border rounded text-sm" />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min Rating:</label>
              <div className="flex">
                {[0, 3, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={`px-2 py-1 text-sm rounded ${minRating === r ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                    {r === 0 ? 'All' : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={() => { setPriceRange([0, 1000000]); setMinRating(0); setLocationFilter('') }}
              className="text-sm text-orange-600 hover:underline">Clear Filters</button>
          </div>
        </div>
        
        {loading ? <LoadingSkeleton count={20} /> : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {filteredProducts.map(p => <ProductCard key={p._id} product={p} showFlashDeal={flash} />)}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20 bg-white rounded-lg">
            <span className="text-5xl sm:text-6xl block mb-4">🔍</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No products found</h2>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
            <button onClick={() => navigate('/products')} className="mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg text-sm">
              Browse All Products
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Product Detail Page with Reviews and Chat
const ProductDetailPage = () => {
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [similarProducts, setSimilarProducts] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerMetrics, setSellerMetrics] = useState({})
  const [selectedImage, setSelectedImage] = useState(0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isInWishlist } = useWishlist()
  const { addToRecentlyViewed } = useRecentlyViewed()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const id = window.location.pathname.split('/').pop()

  useEffect(() => {
    fetch(`${API_URL}/api/products/${id}`).then(r => r.json()).then(d => { 
      if (d.success) {
        setProduct(d.data.product)
        setSelectedImage(0)
        addToRecentlyViewed(d.data.product)
        setReviews(d.data.reviews || [])
        setSimilarProducts(d.data.similarProducts || [])
        setSellerProducts(d.data.sellerProducts || [])
        setSellerMetrics(d.data.sellerMetrics || {})
      }
      setLoading(false) 
    })
  }, [id])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    const result = await addToCart(product._id, quantity)
    if (result?.success) setToast({ message: '✓ Added to cart!', type: 'success' })
    else setToast({ message: result?.message || 'Failed', type: 'error' })
  }

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return }
    const result = await addToCart(product._id, quantity)
    if (result?.success) navigate('/checkout')
    else setToast({ message: result?.message || 'Failed', type: 'error' })
  }

  const handleShareProduct = async () => {
    const share = { title: product.title, text: `Check out ${product.title} on Campus Market for ₦${product.price?.toLocaleString()}`, url: window.location.href }
    try { if (navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(share.url); setToast({ message: 'Product link copied', type: 'success' }) } } catch {}
  }

  const handleReportProduct = async () => {
    if (!user) { sessionStorage.setItem('returnAfterLogin', window.location.pathname); navigate('/login'); return }
    const category = window.prompt('Report category: counterfeit, prohibited, misleading, scam, duplicate or other', 'misleading')
    if (!category) return
    const reason = window.prompt('Explain the problem with this listing:')
    if (!reason) return
    try {
      const result = await fetch(`${API_URL}/api/products/${product._id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ category: category.toLowerCase(), reason }) }).then(r => r.json())
      setToast({ message: result.message || (result.success ? 'Listing reported' : 'Unable to report listing'), type: result.success ? 'success' : 'error' })
    } catch { setToast({ message: 'Unable to submit report', type: 'error' }) }
  }

  const handleReviewSubmit = (reviewData) => {
    const newReview = {
      _id: Date.now().toString(),
      user: { name: user?.name || 'You' },
      ...reviewData,
      createdAt: new Date(),
      isVerified: Boolean(reviewData.isVerified)
    }
    setReviews(prev => [newReview, ...prev])
    setToast({ message: '✓ Thank you for your review!', type: 'success' })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">
          Browse Products
        </button>
      </div>
    </div>
  )

  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} productId={product._id} onSubmit={handleReviewSubmit} />
      
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 bg-white p-3 rounded-lg flex-wrap">
            <button onClick={() => navigate('/')} className="hover:text-orange-600">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/products')} className="hover:text-orange-600">Products</button>
            <span>/</span>
            <span className="text-gray-800 truncate">{product.title}</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Product image gallery */}
            <div className="bg-white rounded-xl p-4 sm:p-6 h-fit lg:sticky lg:top-48">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <ProductImage product={product} index={selectedImage} alt={`${product.title} image ${selectedImage + 1}`} className="object-contain" />
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-full shadow">
                    -{discount}% OFF
                  </div>
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-3">
                  {product.images.slice(0, 6).map((image, index) => (
                    <button key={`${image}-${index}`} onClick={() => setSelectedImage(index)} aria-label={`View product image ${index + 1}`}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-300'}`}>
                      <ProductImage product={product} index={index} alt={`${product.title} thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
              {product.images?.some(image => typeof image === 'string' && image.startsWith('/uploads/')) && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800"><strong>Old image unavailable:</strong> this photo was saved by the previous temporary upload system and no longer exists on Render. The seller must edit this product, remove the old image and upload it again.</div>}
              <p className="text-xs text-gray-500 mt-3 text-center">📍 Ships from {product.location || 'Nigeria'}</p>
            </div>
            
            {/* Product Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white rounded-lg p-4 sm:p-6">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">{product.title}</h1>
                
                {/* Star Rating */}
                <div className="mb-3">
                  <StarRating rating={product.rating || 0} reviewCount={product.reviewCount || 0} size="md" />
                </div>
                
                {/* Trust Badge */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg">
                  <span className="text-green-600">✓</span>
                  <span className="text-xs text-green-700">Admin Verified Seller</span>
                  {product.isApproved && <span className="text-green-600 text-xs">✓ Active</span>}
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm flex-wrap">
                  <span className="text-gray-500">{product.reviewCount || 0} reviews</span>
                  <span className="hidden sm:inline">|</span>
                  <span className="text-gray-500">{product.views || 0} views</span>
                </div>
                
                {/* Price */}
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold" style={{ color: colors.primary }}>
                      ₦{product.price?.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <>
                        <span className="text-base sm:text-lg text-gray-400 line-through">
                          ₦{product.originalPrice?.toLocaleString()}
                        </span>
                        <span className="text-red-500 font-bold text-sm">Save ₦{(product.originalPrice - product.price)?.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Stock */}
                <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm mb-3 sm:mb-4 flex-wrap">
                  <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                    {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : 'Out of Stock'}
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-gray-600 capitalize">{product.condition}</span>
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="text-red-500 font-bold">⚠️ Only {product.stock} left!</span>
                  )}
                </div>
                
                {/* Quantity */}
                <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <span className="text-gray-600 text-sm">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 sm:px-4 py-2 hover:bg-gray-100 text-base sm:text-lg">-</button>
                    <span className="px-3 sm:px-4 py-2 font-bold border-x border-gray-300 text-sm sm:text-base">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-3 sm:px-4 py-2 hover:bg-gray-100 text-base sm:text-lg">+</button>
                  </div>
                </div>
                
                {/* Marketplace safety and delivery */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-start gap-2">
                  <span className="text-blue-600">🛡️</span>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Safer shopping:</strong> inspect or confirm your order before paying on delivery while verified Flutterwave payments are being prepared.</p>
                    <p>Delivery estimate: ₦{(product.shipping?.localFee || 1000).toLocaleString()} within seller's state; ₦{(product.shipping?.nationwideFee || 2500).toLocaleString()} nationwide.</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-4">
                  <button onClick={handleAddToCart} 
                    className="flex-1 py-2 sm:py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base">
                    🛒 Add to Cart
                  </button>
                  <button onClick={handleBuyNow} 
                    className="flex-1 py-2 sm:py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base">
                    Buy Now
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                  <WishlistButton product={product} />
                  <span className="text-sm text-gray-500 mr-2">Wishlist</span>
                  <button onClick={handleShareProduct} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">↗ Share</button>
                  <button onClick={handleReportProduct} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold">⚑ Report listing</button>
                </div>
                
                {/* Chat with Seller */}
                {product.seller?._id && product.chatEnabled !== false && product.seller?.sellerProfile?.chatEnabled !== false && (
                  <ProductChat sellerId={product.seller._id} productId={product._id} productTitle={product.title} />
                )}
              </div>
              
              {/* Seller identity uses only real marketplace records */}
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">🏪 Sold by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 font-bold text-xl">{(product.seller?.sellerProfile?.storeName || product.seller?.name)?.charAt(0)}</span></div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 truncate">{product.seller?.sellerProfile?.storeName || product.seller?.name}</p><VerificationBadge level={sellerMetrics.verificationLevel} /><p className="text-xs text-gray-500 mt-1">⭐ {Number(product.seller?.sellerProfile?.rating || 0).toFixed(1)} • {sellerMetrics.deliveredSales || 0} delivered • {sellerMetrics.followers || 0} followers</p></div>
                  <button onClick={() => navigate(`/stores/${product.seller?._id}`)} className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200">Visit Store</button>
                </div>
                {product.location && <p className="text-sm text-gray-500 mt-3">📍 Ships from {product.location}</p>}
              </div>
              
              {/* Description */}
              <div className="bg-white rounded-lg p-4 sm:p-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">📝 Description</h3>
                <p className="text-gray-600 text-sm sm:text-base whitespace-pre-line">{product.description}</p>
              </div>
              
              {(product.specifications?.length > 0 || product.warranty || product.returnPolicy || product.pickupLocation) && <div className="bg-white rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-gray-800 mb-4">📋 Product details</h3>
                {product.specifications?.length > 0 && <div className="divide-y border rounded-lg mb-4">{product.specifications.map((spec, index) => <div key={`${spec.name}-${index}`} className="grid grid-cols-3 gap-3 p-3 text-sm"><span className="text-gray-500">{spec.name}</span><span className="col-span-2 font-medium text-gray-800">{spec.value}</span></div>)}</div>}
                <div className="grid sm:grid-cols-2 gap-3">{product.warranty && <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs font-bold text-blue-900">Warranty</p><p className="text-xs text-blue-800 mt-1">{product.warranty}</p></div>}{product.returnPolicy && <div className="bg-purple-50 p-3 rounded-lg"><p className="text-xs font-bold text-purple-900">Seller return terms</p><p className="text-xs text-purple-800 mt-1">{product.returnPolicy}</p></div>}{product.pickupLocation && <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs font-bold text-green-900">Pickup</p><p className="text-xs text-green-800 mt-1">{product.pickupLocation}</p></div>}</div>
              </div>}

              {/* Reviews Section */}
              <div className="bg-white rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base">⭐ Customer Reviews ({reviews.length})</h3>
                  {user && <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600">
                    ✍️ Write Review
                  </button>}
                </div>
                
                {/* Rating Summary */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{product.rating?.toFixed(1) || '0.0'}</p>
                    <StarRating rating={product.rating || 0} size="sm" />
                    <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length
                      const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-8">{star}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-gray-500 w-8">{Math.round(percent)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Review List */}
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review._id} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                            {review.user?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.user?.name}</p>
                            {review.isVerified && <span className="text-xs text-green-600">✓ Verified Purchase</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                      {review.aspectRatings && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Quality: {review.aspectRatings.quality}★</span>
                          <span>Delivery: {review.aspectRatings.delivery}★</span>
                          <span>Communication: {review.aspectRatings.communication}★</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {sellerProducts.length > 0 && <section className="mt-8"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black text-gray-900">More from this seller</h2><button onClick={() => navigate(`/stores/${product.seller?._id}`)} className="text-sm font-bold text-orange-600">Visit store →</button></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">{sellerProducts.map(item => <ProductCard key={item._id} product={item} />)}</div></section>}
          {similarProducts.length > 0 && <section className="mt-8"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black text-gray-900">Similar products</h2><button onClick={() => navigate(`/products?category=${product.category}`)} className="text-sm font-bold text-orange-600">View category →</button></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">{similarProducts.map(item => <ProductCard key={item._id} product={item} />)}</div></section>}
        </div>
      </div>
    </>
  )
}

// Cart Page with Dynamic Shipping
const CartPage = () => {
  const { user } = useAuth()
  const { items, summary, removeFromCart, updateQuantity } = useCart()
  const { addToWishlist } = useWishlist()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow">
        <h2 className="text-lg sm:text-2xl font-bold mb-4">Please sign in</h2>
        <button onClick={() => navigate('/login')} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Sign In</button>
      </div>
    </div>
  )
  
  if (items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow">
        <span className="text-5xl sm:text-6xl block mb-4">🛒</span>
        <h2 className="text-lg sm:text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg">Start Shopping</button>
      </div>
    </div>
  )

  const shippingMsg = {
    text: summary.shipping > 0 ? `₦${summary.shipping.toLocaleString()} estimate` : 'Calculated at checkout',
    color: 'text-blue-600'
  }

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🛒 Shopping Cart ({summary.itemCount})</h1>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map(item => (
              <div key={item.product?._id} className="bg-white rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4 border border-gray-200">
                <div className="w-20 sm:w-32 h-20 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><ProductImage product={item.product} alt={item.product?.title} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 text-sm sm:text-base mb-1">{item.product?.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Supplier: {item.product?.seller?.name}</p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={item.product?.rating || 0} size="sm" />
                    <button onClick={() => { addToWishlist(item.product); removeFromCart(item.product?._id); setToast({ message: 'Moved to wishlist!', type: 'success' }) }} className="text-xs text-orange-600 hover:underline">Save for later</button>
                  </div>
                  <p className="text-base sm:text-lg font-bold mt-2" style={{ color: colors.primary }}>₦{item.product?.price?.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.product?._id)} className="text-red-500 hover:bg-red-50 p-1 sm:p-2 rounded text-sm">🗑️</button>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button onClick={() => updateQuantity(item.product?._id, item.quantity - 1)} className="px-2 sm:px-3 py-1 hover:bg-gray-100 text-sm">-</button>
                    <span className="px-2 sm:px-3 py-1 font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product?._id, item.quantity + 1)} className="px-2 sm:px-3 py-1 hover:bg-gray-100 text-sm">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 h-fit">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">📋 Order Summary</h2>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm border-b pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal ({summary.itemCount} items)</span><span className="font-bold">₦{summary.subtotal?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={`font-bold ${shippingMsg.color}`}>{shippingMsg.text}</span></div>
              <p className="text-xs text-gray-500">Final delivery is calculated from each seller's location and your delivery state.</p>
              <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2 sm:pt-3"><span>Estimated total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
              <p className="text-xs text-blue-800">🚚 Delivery prices are set per seller for local and nationwide orders. Enter your state at checkout for the final amount.</p>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-orange-800">🛡️ Current payment method is Pay on Delivery. Inspect or confirm your order before paying.</p>
            </div>
            
            <button onClick={() => navigate('/checkout')} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 text-sm sm:text-base">
              💳 Proceed to Checkout
            </button>
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
  const [showPayment, setShowPayment] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState(null)
  const [pendingOrderAmount, setPendingOrderAmount] = useState(0)
  const [orderItems, setOrderItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('pay_on_delivery')
  const [paymentConfig, setPaymentConfig] = useState({ paymentMode: 'not-configured' })
  const navigate = useNavigate()

  useEffect(() => { fetch(`${API_URL}/api/health`).then(r => r.json()).then(data => { setPaymentConfig(data); if (data.paymentMode === 'test' || data.paymentMode === 'live') setPaymentMethod('flutterwave') }).catch(() => {}) }, [])

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><h2 className="text-2xl">Please sign in</h2></div>
  if (items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Shop Now</button>
      </div>
    </div>
  )

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.state) {
      setToast({ message: 'Please fill all fields', type: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/orders`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, 
        body: JSON.stringify({ shippingAddress: address, paymentMethod }) 
      })
      const data = await res.json()
      if (data.success) {
        setPendingOrderId(data.data.order._id)
        setPendingOrderAmount(data.data.order.finalAmount || summary.total)
        setOrderItems(data.data.order.items || [])
        if (paymentMethod === 'flutterwave') {
          const payment = await fetch(`${API_URL}/api/payments/flutterwave/initialize`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ orderId: data.data.order._id }) }).then(r => r.json())
          if (payment.success && payment.data.checkoutUrl) { window.location.href = payment.data.checkoutUrl; return }
          setToast({ message: payment.message || 'Unable to open Flutterwave checkout', type: 'error' })
        } else setShowPayment(true)
      } else setToast({ message: data.message || 'Order failed', type: 'error' })
      setLoading(false)
    } catch { setLoading(false); setToast({ message: 'Cannot connect to server', type: 'error' }) }
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setToast({ message: '✓ Order placed. Payment is due only on confirmed delivery.', type: 'success' })
    setTimeout(() => navigate('/orders'), 800)
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {showPayment && <PaymentModal isOpen={showPayment} onClose={() => { setShowPayment(false); navigate('/products') }} amount={pendingOrderAmount} orderId={pendingOrderId} orderItems={orderItems} onSuccess={handlePaymentSuccess} />}
      
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">💳 Secure Checkout</h1>
          
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📍 Shipping Address</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                    <input value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Your full name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Phone Number *</label>
                    <input value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="+234..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">Street Address *</label>
                    <input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">City *</label>
                    <input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">State *</label>
                    <input value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Order Summary</h2>
              <div className="space-y-2 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between"><span>{items.length} item(s)</span><span className="font-bold">₦{summary.subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Estimated shipping</span><span className="font-bold text-blue-600">₦{(summary.shipping || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <button onClick={() => setPaymentMethod('flutterwave')} disabled={!['test','live'].includes(paymentConfig.paymentMode)} className={`w-full p-3 border-2 rounded-xl text-left ${paymentMethod === 'flutterwave' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'} disabled:opacity-50`}><p className="font-bold text-sm">💳 Pay securely with Flutterwave {paymentConfig.paymentMode === 'test' && <span className="text-[10px] bg-yellow-200 px-2 py-0.5 rounded-full">TEST MODE</span>}</p><p className="text-xs text-gray-500 mt-1">Card, bank transfer, USSD and enabled methods. Payment is verified by the backend.</p></button>
                <button onClick={() => setPaymentMethod('pay_on_delivery')} className={`w-full p-3 border-2 rounded-xl text-left ${paymentMethod === 'pay_on_delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}><p className="font-bold text-sm">🚚 Pay on Delivery</p><p className="text-xs text-gray-500 mt-1">Inspect or confirm the order before paying the seller.</p></button>
              </div>
              {paymentConfig.paymentMode === 'not-configured' && <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-xs text-yellow-800">Flutterwave has not been configured on Render, so only Pay on Delivery is available.</div>}
              <button onClick={handlePlaceOrder} disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading ? 'Processing...' : paymentMethod === 'flutterwave' ? 'Continue to Flutterwave' : 'Place Pay-on-Delivery Order'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Flutterwave redirect result is never trusted until backend verification succeeds.
const PaymentCallbackPage = () => {
  const { clearCart } = useCart()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, success: false, message: 'Verifying your payment securely...' })
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const txRef = params.get('tx_ref')
    const transactionId = params.get('transaction_id')
    if (status !== 'successful' || !txRef || !transactionId) { setState({ loading: false, success: false, message: status === 'cancelled' ? 'Payment was cancelled. Your order remains unpaid.' : 'Payment was not completed.' }); return }
    fetch(`${API_URL}/api/payments/flutterwave/verify?tx_ref=${encodeURIComponent(txRef)}&transaction_id=${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json()).then(data => { if (data.success) { clearCart(); setState({ loading: false, success: true, message: 'Payment verified. Seller earnings are safely recorded as pending until delivery.' }) } else setState({ loading: false, success: false, message: data.message || 'Payment could not be verified.' }) }).catch(() => setState({ loading: false, success: false, message: 'Could not connect to the verification service.' }))
  }, [])
  return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="bg-white max-w-md w-full rounded-2xl p-8 text-center shadow-xl">{state.loading ? <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /> : <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl ${state.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{state.success ? '✓' : '✕'}</div>}<h1 className="text-2xl font-black mt-5">{state.loading ? 'Checking payment' : state.success ? 'Payment verified' : 'Payment not verified'}</h1><p className="text-sm text-gray-600 mt-3">{state.message}</p>{!state.loading && <div className="grid grid-cols-2 gap-3 mt-6"><button onClick={() => navigate('/products')} className="py-3 bg-gray-100 font-bold rounded-xl">Shop</button><button onClick={() => navigate('/orders')} className="py-3 bg-orange-500 text-white font-bold rounded-xl">My Orders</button></div>}</div></div>
}

// My Orders Page with Tracking and Reports
const MyOrdersPage = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${API_URL}/api/orders`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data.orders); setLoading(false) })
  }, [user, navigate])

  if (!user) return null

  const handleReportIssue = async (orderId) => {
    const reason = prompt('Please describe the issue (e.g., "Item not received", "Item damaged"):')
    if (!reason) return
    
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ reason, orderId })
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: '✓ Report submitted. Admin will review within 24 hours.', type: 'success' })
      } else {
        setToast({ message: data.message || 'Failed to submit report', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to submit report', type: 'error' })
    }
  }

  const retryFlutterwave = async order => {
    try {
      const data = await fetch(`${API_URL}/api/payments/flutterwave/initialize`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ orderId: order._id }) }).then(r => r.json())
      if (data.success && data.data.checkoutUrl) window.location.href = data.data.checkoutUrl
      else setToast({ message: data.message || 'Unable to restart payment', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to payment service', type: 'error' }) }
  }

  const cancelUnpaidOrder = async order => {
    if (!window.confirm('Cancel this unpaid order and return its stock?')) return
    const data = await fetch(`${API_URL}/api/orders/${order._id}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false, message: 'Connection failed' }))
    if (data.success) { setOrders(current => current.map(item => item._id === order._id ? { ...item, status: 'cancelled' } : item)); setToast({ message: data.message, type: 'success' }) }
    else setToast({ message: data.message || 'Unable to cancel order', type: 'error' })
  }

  const confirmDelivery = async orderId => {
    if (!window.confirm('Confirm that you received and inspected this order? This releases the seller’s pending earnings.')) return
    try {
      const data = await fetch(`${API_URL}/api/orders/${orderId}/confirm-delivery`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json())
      if (data.success) { setOrders(current => current.map(order => order._id === orderId ? { ...order, buyerConfirmedDeliveryAt: new Date().toISOString() } : order)); setToast({ message: data.message, type: 'success' }) }
      else setToast({ message: data.message || 'Unable to confirm delivery', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

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
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">📦 My Orders</h1>
        
        {loading ? <LoadingSkeleton count={5} /> : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                {/* Order Tracker */}
                <OrderTracker status={order.status} />
                
                <div className="flex items-center justify-between mt-4 mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus === 'paid' ? '✓ Payment verified' : order.paymentMethod === 'pay_on_delivery' ? 'Pay on Delivery' : 'Payment pending'}</span>
                    {order.transactionId && <p className="text-xs text-gray-400">TXN: {order.transactionId}</p>}
                  </div>
                  <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex gap-3 sm:gap-4 mb-4 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <ProductImage product={{ title: item.title, images: [item.image || getProductImage(item.product)] }} alt={item.title || 'Ordered product'} />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">+{order.items.length - 4}</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t flex-wrap gap-2">
                  <div className="text-xs sm:text-sm text-gray-500">
                    <p>{order.items.length} item(s)</p>
                    <p>Ship to: {order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-gray-500">Total</p>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: colors.primary }}>₦{order.finalAmount?.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/products/${order.items[0]?.product?._id || order.items[0]?.product}`)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200">
                    📦 View Order Details
                  </button>
                  {order.paymentMethod === 'flutterwave' && order.paymentStatus !== 'paid' && order.status === 'pending' && <button onClick={() => retryFlutterwave(order)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded">Retry Flutterwave Payment</button>}
                  {order.paymentStatus !== 'paid' && order.status === 'pending' && <button onClick={() => cancelUnpaidOrder(order)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded">Cancel Unpaid Order</button>}
                  {order.status === 'delivered' && <button onClick={() => navigate(`/products/${order.items[0]?.product?._id || order.items[0]?.product}`)} className="px-4 py-2 bg-orange-100 text-orange-600 text-xs font-medium rounded hover:bg-orange-200">✍️ Leave Review</button>}
                  {order.status === 'delivered' && order.paymentStatus === 'paid' && !order.buyerConfirmedDeliveryAt && <button onClick={() => confirmDelivery(order._id)} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">✓ Confirm Delivery & Release Seller</button>}
                  {order.status !== 'cancelled' && (
                    <button onClick={() => handleReportIssue(order._id)} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100">
                      🚨 Report Issue / Request Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20 bg-white rounded-lg">
            <span className="text-5xl sm:text-6xl block mb-4">📦</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 text-sm">Start shopping to see your orders here</p>
            <button onClick={() => navigate('/products')} className="mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg text-sm">Browse Products</button>
          </div>
        )}
      </div>
    </div>
  )
}

// Wishlist Page
const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center"><h2 className="text-2xl font-bold mb-4">Please sign in</h2><button onClick={() => navigate('/login')} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Sign In</button></div>
    </div>
  )

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">❤️ My Wishlist ({wishlist.length})</h1>
        
        {wishlist.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-white rounded-lg">
            <span className="text-5xl sm:text-6xl block mb-4">💔</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm">Save items you love for later!</p>
            <button onClick={() => navigate('/products')} className="mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg text-sm">Start Shopping</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {wishlist.map(product => (
              <div key={product._id} className="bg-white rounded-lg p-4 border relative">
                <button onClick={() => removeFromWishlist(product._id)} className="absolute top-2 right-2 p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-200">✕</button>
                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3"><ProductImage product={product} alt={product.title} /></div>
                <p className="font-bold text-lg" style={{ color: colors.primary }}>₦{product.price?.toLocaleString()}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.title}</p>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const result = await addToCart(product._id)
                    if (result?.success) {
                      removeFromWishlist(product._id)
                      setToast({ message: '✓ Added to cart!', type: 'success' })
                    }
                  }} className="flex-1 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600">🛒</button>
                  <button onClick={() => navigate(`/products/${product._id}`)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200">👁️</button>
                </div>
              </div>
            ))}
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
  const [showPassword, setShowPassword] = useState(false)

  if (user) { window.location.href = '/'; return null }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      const returnTo = sessionStorage.getItem('returnAfterLogin') || '/'
      sessionStorage.removeItem('returnAfterLogin')
      navigate(returnTo)
    } else setError(result.message || 'Invalid credentials')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: colors.primary }} className="p-8 text-center">
          <div className="bg-white rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span style={{ color: colors.primary }} className="text-2xl font-bold">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-orange-100 text-sm mt-1">Sign in to your account</p>
        </div>
        
        <div className="p-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">⚠️ {error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? '👁️' : '👁️‍🗨️'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-4 text-sm">
            <Link to="/register" className="text-orange-600 font-bold hover:underline">Create Account</Link>
            <span className="text-gray-500">Use the Support button for login help</span>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            🔒 Never share your password, OTP, card PIN or login code with a buyer, seller or support agent.
          </div>
        </div>
      </div>
    </div>
  )
}

// Register Page
const RegisterPage = () => {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer', phone: '', storeName: '', referralCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) { window.location.href = '/'; return null }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const result = await register({...form, confirmPassword: undefined})
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.message || 'Registration failed')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: colors.primary }} className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-orange-100 text-sm mt-1">Join Campus Market - It's Free!</p>
        </div>
        
        <div className="p-6 pb-0">
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
        </div>
        
        <div className="p-6 pt-0">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">⚠️ {error}</div>}
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Your full name" required />
            </div>
            {form.role === 'seller' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Store Name *</label>
                <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Your store/business name" required />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="09051103883" />
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Referral Code (optional)</label><input value={form.referralCode} onChange={e => setForm({...form, referralCode: e.target.value.toUpperCase()})} className="w-full px-4 py-3 border border-gray-300 rounded text-sm uppercase" placeholder="Enter a friend’s code" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password * (min 8 chars)</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Min 8 characters" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Confirm password" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:underline">Sign In</Link>
          </p>
          
          {form.role === 'seller' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
              <p>⚠️ <strong>Note:</strong> Seller accounts require admin approval before listing products.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Seller Dashboard with Analytics, Products, Orders, Wallet & Withdraw
const SellerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [walletData, setWalletData] = useState({ availableBalance: 0, pendingBalance: 0, totalWithdrawn: 0, transactions: [], withdrawals: [], bankAccount: null, minimumWithdrawal: 5000 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [productForm, setProductForm] = useState({
    title: '', description: '', price: '', originalPrice: '', stock: '', brand: '', tags: '',
    category: 'phones-accessories', condition: 'new', location: '',
    localDeliveryFee: '1000', nationwideDeliveryFee: '2500', processingDays: '2',
    pickupAvailable: true, freeShipping: false, chatEnabled: true,
    warranty: '', returnPolicy: '', pickupLocation: ''
  })
  const [productSpecs, setProductSpecs] = useState([{ name: '', value: '' }])
  const [productImages, setProductImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) { navigate('/login'); return }
    Promise.all([
      fetch(`${API_URL}/api/orders/seller/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/products/seller/my-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/orders/seller/orders`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/seller/wallet`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([statsData, productsData, ordersData, walletResult]) => {
      if (statsData.success) setStats(statsData.data)
      if (productsData.success) setProducts(productsData.data.products)
      if (ordersData.success) setOrders(ordersData.data.orders)
      if (walletResult.success) setWalletData(walletResult.data)
      setLoading(false)
    })
  }, [user, navigate])

  // FIXED: Update status without page reload
  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, 
        body: JSON.stringify({ status }) 
      })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: `✓ Order ${status}!`, type: 'success' })
        // Update local state instead of reloading
        setOrders(prevOrders => prevOrders.map(order => 
          order._id === orderId ? { ...order, status } : order
        ))
      }
    } catch { setToast({ message: 'Failed to update', type: 'error' }) }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setToast({ message: 'Enter valid amount', type: 'error' })
      return
    }
    
    const amount = parseFloat(withdrawAmount)
    const availableBalance = walletData.availableBalance || 0
    
    if (amount > availableBalance) {
      setToast({ message: 'Insufficient balance', type: 'error' })
      return
    }
    
    setWithdrawLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/seller/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ amount, bankAccount: '', notes: '' })
      })
      const data = await res.json()
      setWithdrawLoading(false)
      if (data.success) {
        setToast({ message: '✓ Withdrawal request submitted! Admin will process within 24 hours.', type: 'success' })
        setShowWithdraw(false)
        setWalletData(current => ({ ...current, availableBalance: Math.max(0, current.availableBalance - amount), withdrawals: [data.data.withdrawal, ...(current.withdrawals || [])] }))
        setWithdrawAmount('')
      } else {
        setToast({ message: data.message || 'Withdrawal failed', type: 'error' })
      }
    } catch {
      setWithdrawLoading(false)
      setToast({ message: 'Withdrawal failed', type: 'error' })
    }
  }

  const addBankAccount = async () => {
    const bankName = window.prompt('Bank name:')
    if (!bankName) return
    const accountNumber = window.prompt('10-digit account number:')
    if (!accountNumber) return
    const accountName = window.prompt('Account name exactly as shown by the bank:')
    if (!accountName) return
    try {
      const data = await fetch(`${API_URL}/api/seller/bank-account`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ bankName, accountNumber, accountName }) }).then(r => r.json())
      if (data.success) { setWalletData(current => ({ ...current, bankAccount: { bankName, accountNumber, accountName, isVerified: false } })); setToast({ message: data.message, type: 'success' }) }
      else setToast({ message: data.message || 'Unable to save bank account', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (productImages.length + files.length > 6) {
      setToast({ message: 'You can upload a maximum of 6 images', type: 'error' })
      return
    }
    const invalid = files.find(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    if (invalid) {
      setToast({ message: 'Use JPG, PNG or WebP images up to 5MB each', type: 'error' })
      return
    }
    const withPreviews = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve({ file, preview: reader.result, id: `${file.name}-${file.lastModified}-${Math.random()}` })
      reader.readAsDataURL(file)
    })))
    setProductImages(current => [...current, ...withPreviews])
  }

  const removeProductImage = (id) => setProductImages(current => current.filter(image => image.id !== id))
  const makeCoverImage = (id) => setProductImages(current => {
    const selected = current.find(image => image.id === id)
    return selected ? [selected, ...current.filter(image => image.id !== id)] : current
  })

  const openEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      title: product.title || '', description: product.description || '', price: product.price || '', originalPrice: product.originalPrice || '',
      stock: product.stock ?? '', brand: product.brand || '', tags: (product.tags || []).join(', '), category: product.category || 'other',
      condition: product.condition || 'new', location: product.location || '', localDeliveryFee: product.shipping?.localFee ?? '1000',
      nationwideDeliveryFee: product.shipping?.nationwideFee ?? '2500', processingDays: product.shipping?.processingDays ?? '2',
      pickupAvailable: product.shipping?.pickupAvailable !== false, freeShipping: Boolean(product.shipping?.freeShipping), chatEnabled: product.chatEnabled !== false,
      warranty: product.warranty || '', returnPolicy: product.returnPolicy || '', pickupLocation: product.pickupLocation || ''
    })
    setProductSpecs(product.specifications?.length ? product.specifications.map(item => ({ name: item.name || '', value: item.value || '' })) : [{ name: '', value: '' }])
    setProductImages((product.images || []).map((url, index) => ({ existingUrl: url, preview: url, file: null, id: `existing-${index}-${url}` })))
    setShowAddProduct(true)
  }

  const resetProductForm = () => {
    setProductForm({
      title: '', description: '', price: '', originalPrice: '', stock: '', brand: '', tags: '',
      category: 'phones-accessories', condition: 'new', location: '',
      localDeliveryFee: '1000', nationwideDeliveryFee: '2500', processingDays: '2',
      pickupAvailable: true, freeShipping: false, chatEnabled: true,
      warranty: '', returnPolicy: '', pickupLocation: ''
    })
    setProductSpecs([{ name: '', value: '' }])
    setProductImages([])
    setEditingProduct(null)
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (productImages.length < 1) {
      setToast({ message: 'Upload at least one clear product image', type: 'error' })
      return
    }
    if (productForm.description.trim().length < 20) {
      setToast({ message: 'Write a more detailed product description', type: 'error' })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Object.entries(productForm).forEach(([key, value]) => formData.append(key, String(value)))
      formData.append('specifications', JSON.stringify(productSpecs.filter(item => item.name.trim() && item.value.trim())))
      formData.append('existingImages', JSON.stringify(productImages.filter(image => image.existingUrl).map(image => image.existingUrl)))
      productImages.filter(image => image.file).forEach(({ file }) => formData.append('images', file))
      const res = await fetch(editingProduct ? `${API_URL}/api/products/${editingProduct._id}` : `${API_URL}/api/products`, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData
      })
      const data = await res.json()
      setUploading(false)
      if (data.success) {
        setToast({ message: data.message || '✓ Product submitted for approval!', type: 'success' })
        setShowAddProduct(false)
        resetProductForm()
        const refreshed = await fetch(`${API_URL}/api/products/seller/my-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json())
        if (refreshed.success) setProducts(refreshed.data.products)
      } else {
        setToast({ message: data.message || 'Failed to add product', type: 'error' })
      }
    } catch {
      setUploading(false)
      setToast({ message: 'Upload failed. Check your connection and image-storage setup.', type: 'error' })
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_URL}/api/products/${product._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      const data = await res.json()
      if (data.success) {
        setProducts(current => current.filter(item => item._id !== product._id))
        setToast({ message: 'Product deleted', type: 'success' })
      } else setToast({ message: data.message || 'Unable to delete product', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📊 Seller Dashboard</h1>
            <div className="flex gap-2">
              {(user?.sellerProfile?.isApproved || user?.role === 'admin') ? (
                <>
                  <button onClick={() => setShowAddProduct(true)} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 text-sm">
                    ➕ Add Product
                  </button>
                  <button onClick={() => setShowWithdraw(true)} className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 text-sm">
                    💰 Withdraw
                  </button>
                </>
              ) : (
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 font-bold rounded-lg text-sm">⏳ Awaiting Approval</span>
              )}
            </div>
          </div>
          
          {/* Analytics Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats?.stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats?.stats?.pendingOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Products</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{products.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Wallet</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">₦{(user?.walletBalance || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Withdraw Modal */}
          {showWithdraw && (
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">💰 Withdraw Funds</h2>
                  <button onClick={() => setShowWithdraw(false)} className="text-gray-500 text-2xl">✕</button>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-600">₦{(walletData.availableBalance || 0).toLocaleString()}</p>
                </div>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Amount to Withdraw (₦)</label>
                    <input type="number" min={walletData.minimumWithdrawal || 5000} max={walletData.availableBalance || 0} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm"
                      placeholder="Enter amount" required />
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-yellow-700">⚠️ Withdrawal requests are processed within 24 hours by admin.</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg">Cancel</button>
                    <button type="submit" disabled={withdrawLoading} className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50">
                      {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
                  <button onClick={() => { setShowAddProduct(false); resetProductForm() }} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="Close product form">✕</button>
                </div>
                <form onSubmit={handleAddProduct} className="space-y-6">
                  {/* Multiple product image upload */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-800">Product images * <span className="font-normal text-gray-500">({productImages.length}/6)</span></label>
                      <span className="text-xs text-gray-500">First image is the cover</span>
                    </div>
                    <label className="block border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 rounded-xl p-5 text-center cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelection} className="sr-only" disabled={productImages.length >= 6} />
                      <span className="text-3xl block mb-2">📷</span>
                      <span className="text-sm font-bold text-orange-700">Click to upload multiple images</span>
                      <span className="text-xs text-gray-500 block mt-1">JPG, PNG or WebP • maximum 6 images • 5MB each</span>
                      <span className="text-xs text-gray-500 block">Use bright, clear photos from different angles. Do not use screenshots with phone numbers.</span>
                    </label>
                    {productImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        {productImages.map((image, index) => (
                          <div key={image.id} className={`relative rounded-xl overflow-hidden border-2 bg-gray-100 aspect-square ${index === 0 ? 'border-orange-500' : 'border-gray-200'}`}>
                            <img src={image.preview} alt={`Upload preview ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">{index === 0 ? 'Cover' : `Image ${index + 1}`}</div>
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex gap-1 justify-end">
                              {index !== 0 && <button type="button" onClick={() => makeCoverImage(image.id)} className="text-[10px] bg-white text-gray-800 px-2 py-1 rounded">Make cover</button>}
                              <button type="button" onClick={() => removeProductImage(image.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Product title *</label>
                      <input value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="Example: Samsung Galaxy A54 128GB – New" minLength={5} maxLength={180} required />
                    </div>
                    <div>
                      <div className="flex justify-between"><label className="text-sm font-medium text-gray-700 mb-1 block">Detailed description *</label><span className="text-xs text-gray-400">{productForm.description.length}/5000</span></div>
                      <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" rows={5} maxLength={5000} placeholder="Describe condition, size, colour, included accessories, defects, warranty and what makes the item useful..." required />
                    </div>
                  </section>

                  <section className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Selling price (₦) *</label>
                      <input type="number" min="1" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="85000" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Original price (₦)</label>
                      <input type="number" min="0" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="100000" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Available stock *</label>
                      <input type="number" min="0" max="99999" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="10" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Seller location/state *</label>
                      <input value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="Example: Osun State" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                      <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" required>
                        <option value="phones-accessories">📱 Phones & Accessories</option>
                        <option value="electronics">🎧 Electronics</option>
                        <option value="fashion">👕 Fashion</option>
                        <option value="kitchen-home">🏠 Apartment & Home</option>
                        <option value="furniture">🪑 Furniture</option>
                        <option value="beauty-health">💄 Beauty & Health</option>
                        <option value="books-education">📚 Books & Education</option>
                        <option value="groceries">🛒 Groceries</option>
                        <option value="sports-fitness">⚽ Sports & Fitness</option>
                        <option value="baby-kids">🧸 Baby & Kids</option>
                        <option value="automotive">🚗 Automotive</option>
                        <option value="other">📦 Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Condition *</label>
                      <select value={productForm.condition} onChange={e => setProductForm({...productForm, condition: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" required>
                        <option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand</label>
                      <input value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="Samsung, Nike, Generic..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Search tags</label>
                      <input value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm" placeholder="android, 5g, student phone" />
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3"><div><h3 className="font-bold text-gray-900">📋 Specifications</h3><p className="text-xs text-gray-500">Add factual details buyers can compare.</p></div>{productSpecs.length < 20 && <button type="button" onClick={() => setProductSpecs(current => [...current, { name: '', value: '' }])} className="text-xs font-bold text-orange-600">+ Add row</button>}</div>
                    <div className="space-y-2">{productSpecs.map((spec, index) => <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-2"><input value={spec.name} onChange={e => setProductSpecs(current => current.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="e.g. Colour" className="px-3 py-2 border rounded-lg text-sm" /><input value={spec.value} onChange={e => setProductSpecs(current => current.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} placeholder="e.g. Midnight Black" className="px-3 py-2 border rounded-lg text-sm" /><button type="button" onClick={() => setProductSpecs(current => current.length === 1 ? [{ name: '', value: '' }] : current.filter((_, i) => i !== index))} className="px-2 text-red-500">✕</button></div>)}</div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-4"><div><label className="text-xs text-gray-600">Warranty</label><input value={productForm.warranty} onChange={e => setProductForm({...productForm, warranty: e.target.value})} placeholder="e.g. 6 months seller warranty" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div><div><label className="text-xs text-gray-600">Return terms</label><input value={productForm.returnPolicy} onChange={e => setProductForm({...productForm, returnPolicy: e.target.value})} placeholder="e.g. 3 days if defective" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div><div><label className="text-xs text-gray-600">Pickup location</label><input value={productForm.pickupLocation} onChange={e => setProductForm({...productForm, pickupLocation: e.target.value})} placeholder="Public pickup area" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div></div>
                  </section>

                  <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="font-bold text-blue-900 mb-3">🚚 Delivery settings</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><label className="text-xs text-blue-800 mb-1 block">Within your state (₦)</label><input type="number" min="0" value={productForm.localDeliveryFee} onChange={e => setProductForm({...productForm, localDeliveryFee: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                      <div><label className="text-xs text-blue-800 mb-1 block">Nationwide delivery (₦)</label><input type="number" min="0" value={productForm.nationwideDeliveryFee} onChange={e => setProductForm({...productForm, nationwideDeliveryFee: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                      <div><label className="text-xs text-blue-800 mb-1 block">Processing days</label><input type="number" min="0" max="30" value={productForm.processingDays} onChange={e => setProductForm({...productForm, processingDays: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-900">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.pickupAvailable} onChange={e => setProductForm({...productForm, pickupAvailable: e.target.checked})} /> Pickup available</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.freeShipping} onChange={e => setProductForm({...productForm, freeShipping: e.target.checked})} /> Free delivery</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.chatEnabled} onChange={e => setProductForm({...productForm, chatEnabled: e.target.checked})} /> Allow buyer chat</label>
                    </div>
                  </section>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-xs text-yellow-800">📋 Your product will remain pending until an admin checks its images, description, price and prohibited-item compliance.</p>
                  </div>
                  <div className="flex gap-3 sticky bottom-0 bg-white pt-3 border-t">
                    <button type="button" onClick={() => { setShowAddProduct(false); resetProductForm() }} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={uploading} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50">
                      {uploading ? `Uploading ${productImages.filter(image => image.file).length} new image(s)...` : editingProduct ? '✓ Save changes for approval' : '✓ Submit for approval'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b overflow-x-auto">
              <button onClick={() => setActiveTab('overview')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'overview' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📊 Overview</button>
              <button onClick={() => setActiveTab('products')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'products' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📦 Products ({products.length})</button>
              <button onClick={() => setActiveTab('orders')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📝 Orders ({orders.length})</button>
              <button onClick={() => setActiveTab('wallet')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'wallet' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>💰 Wallet</button>
            </div>
            
            <div className="p-4 sm:p-6">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">🚀 Quick Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => setShowAddProduct(true)} className="w-full text-left px-3 py-2 bg-white rounded text-sm hover:bg-gray-50">➕ Add New Product</button>
                      <button onClick={() => setActiveTab('orders')} className="w-full text-left px-3 py-2 bg-white rounded text-sm hover:bg-gray-50">📦 View Orders</button>
                      <button onClick={() => setShowWithdraw(true)} className="w-full text-left px-3 py-2 bg-white rounded text-sm hover:bg-gray-50">💰 Withdraw Funds</button>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">📈 Store Performance</h3>
                    <p className="text-sm text-gray-500">Rating: ⭐ {user?.sellerProfile?.rating || 0} | Sales: {user?.sellerProfile?.totalSales || 0} | Status: {user?.sellerProfile?.isApproved ? '✓ Approved' : '⏳ Pending'}</p>
                    <p className="text-sm text-gray-500 mt-2">Wallet Balance: ₦{(user?.walletBalance || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  {products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs sm:text-sm text-gray-500 border-b">
                            <th className="pb-4 pr-4">Product</th>
                            <th className="pb-4 pr-4">Price</th>
                            <th className="pb-4 pr-4">Stock</th>
                            <th className="pb-4 pr-4">Status</th>
                            <th className="pb-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p._id} className="border-b text-sm">
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-3 min-w-[220px]">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"><ProductImage product={p} alt={p.title} /></div>
                                  <div><p className="font-medium line-clamp-2">{p.title}</p><p className="text-xs text-gray-400">{p.images?.length || 0} image(s)</p>{p.images?.some(image => typeof image === 'string' && image.startsWith('/uploads/')) && <p className="text-[10px] text-red-600">Old image — edit and re-upload</p>}</div>
                                </div>
                              </td>
                              <td className="py-4 pr-4 font-bold">₦{p.price?.toLocaleString()}</td>
                              <td className="py-4 pr-4">{p.stock}</td>
                              <td className="py-4 pr-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.isApproved ? 'bg-green-100 text-green-700' : p.isRejected ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {p.isApproved ? '✓ Active' : p.isRejected ? '✕ Needs changes' : '⏳ Pending'}
                                </span>
                                {p.approvalNote && <p className="text-[10px] text-red-600 mt-1 max-w-[180px]">{p.approvalNote}</p>}
                              </td>
                              <td className="py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => openEditProduct(p)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100">Edit</button>
                                  <button onClick={() => handleDeleteProduct(p)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm mb-4">No products yet</p>
                      <button onClick={() => setShowAddProduct(true)} className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">➕ Add Your First Product</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {orders.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {orders.map(order => (
                        <div key={order._id} className="border rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div>
                              <p className="font-bold text-sm sm:text-base">#{order._id.slice(-8).toUpperCase()}</p>
                              <p className="text-xs sm:text-sm text-gray-500">{order.buyer?.name} | {order.buyer?.phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm sm:text-base">₦{(order.sellerAmount || order.finalAmount)?.toLocaleString()}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs sm:text-sm text-gray-500">{order.items.length} item(s)</p>
                            <div className="flex gap-2 flex-wrap">
                              {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="px-4 py-2 bg-blue-500 text-white text-xs rounded-lg">✓ Confirm</button>}
                              {order.status === 'confirmed' && <button onClick={() => handleUpdateStatus(order._id, 'processing')} className="px-4 py-2 bg-purple-500 text-white text-xs rounded-lg">📦 Process</button>}
                              {order.status === 'processing' && <button onClick={() => handleUpdateStatus(order._id, 'shipped')} className="px-4 py-2 bg-indigo-500 text-white text-xs rounded-lg">🚚 Ship</button>}
                              {order.status === 'shipped' && <button onClick={() => handleUpdateStatus(order._id, 'delivered')} className="px-4 py-2 bg-green-500 text-white text-xs rounded-lg">✓ Delivered</button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-12 text-gray-500 text-sm">No orders yet</p>}
                </div>
              )}

              {activeTab === 'wallet' && <div>
                <div className="grid sm:grid-cols-3 gap-3 mb-6"><div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-xl"><p className="text-xs opacity-80">Available to withdraw</p><p className="text-3xl font-black mt-1">₦{(walletData.availableBalance || 0).toLocaleString()}</p></div><div className="bg-orange-50 border border-orange-200 p-5 rounded-xl"><p className="text-xs text-orange-700">Pending until delivery</p><p className="text-2xl font-black text-orange-900 mt-1">₦{(walletData.pendingBalance || 0).toLocaleString()}</p></div><div className="bg-green-50 border border-green-200 p-5 rounded-xl"><p className="text-xs text-green-700">Total withdrawn</p><p className="text-2xl font-black text-green-900 mt-1">₦{(walletData.totalWithdrawn || 0).toLocaleString()}</p></div></div>
                <div className="grid md:grid-cols-2 gap-4 mb-6"><div className="p-4 border rounded-xl"><h4 className="font-bold">🏦 Payout bank</h4>{walletData.bankAccount ? <div className="text-sm mt-2"><p>{walletData.bankAccount.bankName}</p><p className="font-bold">{walletData.bankAccount.accountName}</p><p>******{walletData.bankAccount.accountNumber?.slice(-4)}</p><span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${walletData.bankAccount.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{walletData.bankAccount.isVerified ? '✓ Verified' : 'Awaiting admin verification'}</span></div> : <p className="text-sm text-gray-500 mt-2">No payout account saved.</p>}<button onClick={addBankAccount} className="mt-3 text-sm font-bold text-blue-600">{walletData.bankAccount ? 'Change account' : 'Add bank account'}</button></div><div className="p-4 border rounded-xl"><h4 className="font-bold">💵 Manual withdrawal</h4><p className="text-xs text-gray-500 mt-2">Minimum ₦{(walletData.minimumWithdrawal || 5000).toLocaleString()}. Requested funds are reserved until admin pays, rejects or records a failure.</p><button onClick={() => setShowWithdraw(true)} disabled={!walletData.bankAccount?.isVerified || walletData.availableBalance < walletData.minimumWithdrawal} className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-40">Request Withdrawal</button></div></div>
                <h4 className="font-bold mb-3">Withdrawal history</h4>{walletData.withdrawals?.length ? <div className="space-y-2">{walletData.withdrawals.map(item => <div key={item._id} className="border rounded-lg p-3 flex justify-between gap-3"><div><p className="font-bold text-sm">₦{item.amount?.toLocaleString()}</p><p className="text-xs text-gray-500">{item.reference}</p></div><div className="text-right"><span className="text-xs font-bold capitalize">{item.status}</span>{item.amountTransferred != null && <p className="text-xs text-green-600">Transferred ₦{item.amountTransferred.toLocaleString()}</p>}</div></div>)}</div> : <p className="text-sm text-gray-500">No withdrawal requests yet.</p>}
              </div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Admin Dashboard with Pending Products, Sellers, Reports
const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingProducts, setPendingProducts] = useState([])
  const [pendingSellers, setPendingSellers] = useState([])
  const [pendingBanks, setPendingBanks] = useState([])
  const [reports, setReports] = useState([])
  const [productReports, setProductReports] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [supportTickets, setSupportTickets] = useState([])
  const [adminChats, setAdminChats] = useState([])
  const [moderators, setModerators] = useState([])
  const [adminError, setAdminError] = useState('')
  const [backendVersion, setBackendVersion] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !['admin', 'moderator'].includes(user.role)) { navigate('/login'); return }
    
    const fetchData = async () => {
      try {
        setLoading(true)
        setAdminError('')
        const [statsRes, productsRes, sellersRes, reportsRes, ticketsRes, chatsRes, healthRes, moderatorsRes, productReportsRes, withdrawalsRes, banksRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_URL}/api/admin/pending-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false, message: 'Pending-products route is unavailable' })),
          fetch(`${API_URL}/api/admin/pending-sellers`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false, message: 'Pending-sellers route is unavailable' })),
          fetch(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_URL}/api/admin/support-tickets`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_URL}/api/chat/chats`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_URL}/api/health?check=${Date.now()}`).then(r => r.json()).catch(() => ({ success: false })),
          user.role === 'admin' ? fetch(`${API_URL}/api/admin/moderators`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })) : Promise.resolve({ success: true, data: { moderators: [] } }),
          fetch(`${API_URL}/api/admin/product-reports`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })),
          user.role === 'admin' ? fetch(`${API_URL}/api/admin/withdrawals`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })) : Promise.resolve({ success: true, data: { withdrawals: [] } }),
          user.role === 'admin' ? fetch(`${API_URL}/api/admin/pending-bank-accounts`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false })) : Promise.resolve({ success: true, data: { sellers: [] } })
        ])
        
        if (statsRes.success) setStats(statsRes.data)
        
        setBackendVersion(healthRes.version || 'unknown')
        if (productsRes.success) setPendingProducts(productsRes.data.products || [])
        if (sellersRes.success) setPendingSellers(sellersRes.data.sellers || [])
        if (reportsRes.success) setReports(reportsRes.data.reports || [])
        if (ticketsRes.success) setSupportTickets(ticketsRes.data.tickets || [])
        if (chatsRes.success) setAdminChats(chatsRes.data.chats || [])
        if (moderatorsRes.success) setModerators(moderatorsRes.data.moderators || [])
        if (productReportsRes.success) setProductReports(productReportsRes.data.reports || [])
        if (withdrawalsRes.success) setWithdrawals(withdrawalsRes.data.withdrawals || [])
        if (banksRes.success) setPendingBanks(banksRes.data.sellers || [])
        if (!productsRes.success || !sellersRes.success || !String(healthRes.version || '').startsWith('7.')) {
          setAdminError(`Admin approval services are not running on the current backend (detected version: ${healthRes.version || 'unknown'}). Render must deploy the latest backend commit before pending products and sellers can appear.`)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching admin data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, navigate, refreshKey])

  const handleApproveProduct = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: '✓ Product approved!', type: 'success' })
        setPendingProducts(prev => prev.filter(p => p._id !== productId))
      } else setToast({ message: data.message || 'Product failed the approval checklist', type: 'error' })
    } catch { setToast({ message: 'Failed to approve', type: 'error' }) }
  }

  const handleRejectProduct = async (productId) => {
    const reason = window.prompt('Tell the seller exactly what must be corrected:')
    if (!reason) return
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ reason }) })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: 'Product rejected', type: 'info' })
        setPendingProducts(prev => prev.filter(p => p._id !== productId))
      }
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const handleApproveSeller = async (sellerId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sellers/${sellerId}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: '✓ Seller approved!', type: 'success' })
        setPendingSellers(prev => prev.filter(s => s._id !== sellerId))
      } else setToast({ message: data.message || 'Unable to approve seller', type: 'error' })
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const handleProcessRefund = async (orderId, action) => {
    const report = reports.find(item => item.orderId === orderId)
    const payload = {}
    if (action === 'approve-refund') {
      payload.amountRefunded = Number(window.prompt('Enter the exact amount already refunded to the buyer:', String(report?.amount || '')))
      payload.refundReference = window.prompt('Enter the Flutterwave refund ID or bank transfer reference:')
      if (!payload.amountRefunded || !payload.refundReference) return
    } else payload.note = window.prompt('Reason for rejecting the refund request:') || ''
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/${action}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: `✓ Refund ${action}!`, type: 'success' })
        setReports(prev => prev.filter(r => r.orderId !== orderId))
      }
    } catch { setToast({ message: 'Failed to process refund', type: 'error' }) }
  }

  const handleListingReport = async (report, status, hideProduct = false) => {
    const note = window.prompt('Moderator note (optional):') || ''
    try {
      const data = await fetch(`${API_URL}/api/admin/product-reports/${report._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ status, hideProduct, note }) }).then(r => r.json())
      if (data.success) setProductReports(current => current.map(item => item._id === report._id ? { ...item, status } : item))
      else setToast({ message: data.message || 'Unable to update report', type: 'error' })
    } catch { setToast({ message: 'Unable to update report', type: 'error' }) }
  }

  const handleSupportReply = async (ticket) => {
    const message = window.prompt(`Reply to ${ticket.user?.name || 'this user'}:`)
    if (!message?.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/admin/support-tickets/${ticket._id}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ message: message.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setSupportTickets(current => current.map(item => item._id === ticket._id ? data.data.ticket : item))
        setToast({ message: '✓ Reply sent to the user', type: 'success' })
      } else setToast({ message: data.message || 'Unable to send reply', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to support service', type: 'error' }) }
  }

  const handleTicketStatus = async (ticket, status) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support-tickets/${ticket._id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) setSupportTickets(current => current.map(item => item._id === ticket._id ? { ...item, status } : item))
    } catch { setToast({ message: 'Unable to update ticket', type: 'error' }) }
  }

  const createModerator = async () => {
    const name = window.prompt('Moderator full name:')
    if (!name) return
    const email = window.prompt('Moderator email address:')
    if (!email) return
    const password = window.prompt('Temporary password (at least 10 characters):')
    if (!password) return
    try {
      const data = await fetch(`${API_URL}/api/admin/moderators`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ name, email, password }) }).then(response => response.json())
      if (data.success) { setModerators(current => [data.data.moderator, ...current]); setToast({ message: data.message, type: 'success' }) }
      else setToast({ message: data.message || 'Unable to create moderator', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

  const removeModerator = async (moderator) => {
    if (!window.confirm(`Remove moderator access for ${moderator.name}?`)) return
    try {
      const data = await fetch(`${API_URL}/api/admin/moderators/${moderator._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(response => response.json())
      if (data.success) setModerators(current => current.filter(item => item._id !== moderator._id))
      else setToast({ message: data.message || 'Unable to remove moderator', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

  const verifySellerBank = async seller => {
    if (!window.confirm(`Confirm that you independently checked ${seller.sellerProfile?.bankAccount?.accountName} / ${seller.sellerProfile?.bankAccount?.accountNumber} at ${seller.sellerProfile?.bankAccount?.bankName}?`)) return
    try {
      const data = await fetch(`${API_URL}/api/admin/sellers/${seller._id}/verify-bank`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json())
      if (data.success) { setPendingBanks(current => current.filter(item => item._id !== seller._id)); setToast({ message: 'Bank account verified', type: 'success' }) }
      else setToast({ message: data.message || 'Unable to verify account', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to server', type: 'error' }) }
  }

  const processWithdrawal = async (withdrawal, action) => {
    const payload = { action }
    if (action === 'paid') {
      payload.amountTransferred = Number(window.prompt('Amount actually transferred:', String(withdrawal.amount)))
      payload.transferReference = window.prompt('Bank transfer reference or session ID:')
      if (!payload.amountTransferred || !payload.transferReference) return
      payload.transferDate = new Date().toISOString()
    } else if (action === 'reject' || action === 'failed') payload.note = window.prompt('Reason:') || ''
    try {
      const data = await fetch(`${API_URL}/api/admin/withdrawals/${withdrawal._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(payload) }).then(r => r.json())
      if (data.success) { setWithdrawals(current => current.map(item => item._id === withdrawal._id ? data.data.withdrawal : item)); setToast({ message: `Withdrawal ${data.data.withdrawal.status}`, type: 'success' }) }
      else setToast({ message: data.message || 'Unable to update withdrawal', type: 'error' })
    } catch { setToast({ message: 'Unable to connect to server', type: 'error' }) }
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6"><h1 className="text-xl sm:text-2xl font-bold text-gray-800">⚙️ {user.role === 'moderator' ? 'Moderator' : 'Admin'} Dashboard</h1><div className="flex items-center gap-2"><button onClick={() => setRefreshKey(key => key + 1)} disabled={loading} className="text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50">↻ Refresh</button><span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Backend v{backendVersion || 'checking'}</span></div></div>
          {adminError && <div className="mb-6 bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl"><p className="font-bold">⚠️ Backend deployment required</p><p className="text-sm mt-1">{adminError}</p><a href={`${API_URL}/api/health?v=7`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm font-bold underline">Open backend health check</a></div>}
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats?.stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Sellers</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats?.stats?.totalSellers || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Products</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.stats?.totalProducts || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats?.stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">⚠️ Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{pendingProducts.length + pendingSellers.length + reports.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b overflow-x-auto">
              <button onClick={() => setActiveTab('overview')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'overview' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📊 Overview</button>
              <button onClick={() => setActiveTab('products')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'products' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📦 Pending Products ({pendingProducts.length})</button>
              <button onClick={() => setActiveTab('sellers')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'sellers' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🏪 Pending Sellers ({pendingSellers.length})</button>
              <button onClick={() => setActiveTab('reports')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'reports' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🚨 Order Reports ({reports.length})</button>
              <button onClick={() => setActiveTab('listing-reports')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'listing-reports' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>⚑ Listing Reports ({productReports.length})</button>
              {user.role === 'admin' && <button onClick={() => setActiveTab('banks')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'banks' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🏦 Bank Checks ({pendingBanks.length})</button>}
              {user.role === 'admin' && <button onClick={() => setActiveTab('withdrawals')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'withdrawals' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>💸 Withdrawals ({withdrawals.filter(item => item.status === 'requested').length})</button>}
              <button onClick={() => setActiveTab('chats')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'chats' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>💬 Support Chats</button>
              {user.role === 'admin' && <button onClick={() => setActiveTab('team')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'team' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🛡️ Moderators ({moderators.length})</button>}
            </div>
            
            <div className="p-4 sm:p-6">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">📋 Pending Actions</h3>
                    <div className="space-y-2 text-sm">
                      <p>• {pendingProducts.length} products awaiting approval</p>
                      <p>• {pendingSellers.length} sellers awaiting approval</p>
                      <p>• {reports.length} refund/dispute reports</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">📊 Quick Stats</h3>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600"><p>Verified payment volume: ₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p><p>Campus Market commission: ₦{(stats?.stats?.platformCommission || 0).toLocaleString()}</p><p>Gateway fees charged to sellers: ₦{(stats?.stats?.gatewayFees || 0).toLocaleString()}</p><p>Seller pending liability: ₦{(stats?.stats?.sellerPendingLiability || 0).toLocaleString()}</p><p>Seller available liability: ₦{(stats?.stats?.sellerAvailableLiability || 0).toLocaleString()}</p></div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  {pendingProducts.length > 0 ? (
                    <div className="space-y-4">
                      {pendingProducts.map(p => (
                        <div key={p._id} className="border rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><ProductImage product={p} alt={p.title} /></div>
                            <div>
                              <p className="font-bold text-sm">{p.title}</p>
                              <p className="text-xs text-gray-500">₦{p.price?.toLocaleString()} | Stock: {p.stock}</p>
                              <p className="text-xs text-gray-500">Seller: {p.seller?.name || 'Unknown'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveProduct(p._id)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600">✓ Approve</button>
                            <button onClick={() => handleRejectProduct(p._id)} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600">✕ Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-8 text-gray-500 text-sm">No pending products ✓</p>}
                </div>
              )}

              {activeTab === 'sellers' && (
                <div>
                  {pendingSellers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingSellers.map(s => (
                        <div key={s._id} className="border rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                            <p className="text-xs text-gray-500">Phone: {s.phone || 'N/A'}</p>
                            {s.sellerProfile?.storeName && <p className="text-xs text-blue-600">Store: {s.sellerProfile.storeName}</p>}
                          </div>
                          <div className="flex gap-2">
                            {user.role === 'admin' ? <button onClick={() => handleApproveSeller(s._id)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600">✓ Approve</button> : <span className="text-xs text-gray-500">Admin approval required</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-8 text-gray-500 text-sm">No pending sellers ✓</p>}
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  {reports.length > 0 ? (
                    <div className="space-y-4">
                      {reports.map(r => (
                        <div key={r._id || r.orderId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <p className="font-bold text-sm">Order: #{r.orderId?.slice(-8).toUpperCase()}</p>
                            <span className={`px-3 py-1 text-xs font-bold rounded ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {r.status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{r.reason}</p>
                          <p className="text-xs text-gray-500 mb-3">Reported: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'}</p>
                          <div className="flex gap-2">
                            {user.role === 'admin' ? <>
                              <button onClick={() => handleProcessRefund(r.orderId, 'approve-refund')} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600">✓ Approve Refund</button>
                              <button onClick={() => handleProcessRefund(r.orderId, 'reject-refund')} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600">✕ Reject</button>
                            </> : <span className="text-xs text-gray-500">Moderator review only — admin makes the final decision.</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-8 text-gray-500 text-sm">No refund reports ✓</p>}
                </div>
              )}

              {activeTab === 'listing-reports' && <div><h3 className="font-bold mb-4">Reported listings</h3>{productReports.length ? <div className="space-y-3">{productReports.map(report => <div key={report._id} className="border rounded-xl p-4"><div className="flex justify-between gap-3"><div><p className="font-bold text-sm">{report.product?.title || 'Removed product'}</p><p className="text-xs text-gray-500">Reporter: {report.reporter?.name} • Seller: {report.seller?.sellerProfile?.storeName || report.seller?.name}</p></div><span className="text-xs font-bold uppercase">{report.category}</span></div><p className="text-sm mt-3 bg-gray-50 p-3 rounded-lg">{report.reason}</p><p className="text-xs text-gray-400 mt-2">Status: {report.status}</p><div className="flex gap-2 mt-3"><button onClick={() => handleListingReport(report, 'reviewed')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">Mark reviewed</button><button onClick={() => handleListingReport(report, 'dismissed')} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">Dismiss</button><button onClick={() => handleListingReport(report, 'actioned', true)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">Hide product</button></div></div>)}</div> : <p className="text-gray-500 text-sm text-center py-8">No listing reports</p>}</div>}

              {activeTab === 'banks' && user.role === 'admin' && <div><div className="mb-4"><h3 className="font-bold">Seller bank-account verification</h3><p className="text-xs text-gray-500 mt-1">Check the account through your bank or Flutterwave before approving. Never rely only on seller-entered text.</p></div>{pendingBanks.length ? <div className="space-y-3">{pendingBanks.map(seller => <div key={seller._id} className="border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"><div><p className="font-bold text-sm">{seller.sellerProfile?.storeName || seller.name}</p><p className="text-xs text-gray-500">{seller.email} • {seller.phone}</p><p className="text-sm mt-2">{seller.sellerProfile?.bankAccount?.bankName} • <strong>{seller.sellerProfile?.bankAccount?.accountName}</strong> • {seller.sellerProfile?.bankAccount?.accountNumber}</p></div><button onClick={() => verifySellerBank(seller)} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg">I verified this account</button></div>)}</div> : <p className="text-center py-8 text-sm text-gray-500">No bank accounts awaiting verification</p>}</div>}

              {activeTab === 'withdrawals' && user.role === 'admin' && <div><h3 className="font-bold mb-4">Manual seller withdrawals</h3>{withdrawals.length ? <div className="space-y-3">{withdrawals.map(item => <div key={item._id} className="border rounded-xl p-4"><div className="flex justify-between gap-3 flex-wrap"><div><p className="font-bold">₦{item.amount?.toLocaleString()}</p><p className="text-xs text-gray-500">{item.seller?.sellerProfile?.storeName || item.seller?.name} • {item.reference}</p><p className="text-xs mt-2">{item.bankAccount?.bankName} • {item.bankAccount?.accountName} • {item.bankAccount?.accountNumber}</p></div><span className="text-xs font-bold uppercase">{item.status}</span></div><div className="flex flex-wrap gap-2 mt-3">{item.status === 'requested' && <button onClick={() => processWithdrawal(item, 'approve')} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Approve</button>}{['requested','approved'].includes(item.status) && <button onClick={() => processWithdrawal(item, 'processing')} className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg">Processing</button>}{['approved','processing'].includes(item.status) && <button onClick={() => processWithdrawal(item, 'paid')} className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg">Confirm Paid</button>}{!['paid','rejected','failed'].includes(item.status) && <button onClick={() => processWithdrawal(item, 'reject')} className="px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg">Reject & Restore</button>}</div>{item.transferReference && <p className="text-xs text-green-700 mt-3">Transferred ₦{item.amountTransferred?.toLocaleString()} • Ref {item.transferReference}</p>}</div>)}</div> : <p className="text-gray-500 text-sm text-center py-8">No withdrawal requests</p>}</div>}

              {activeTab === 'team' && user.role === 'admin' && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5"><div><h3 className="font-bold text-gray-900">Moderator accounts</h3><p className="text-xs text-gray-500">Moderators can review listings, reports and human-support tickets but cannot create other moderators or approve refunds.</p></div><button onClick={createModerator} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg">+ Add Moderator</button></div>
                  {moderators.length ? <div className="space-y-3">{moderators.map(moderator => <div key={moderator._id} className="border rounded-xl p-4 flex items-center justify-between gap-3"><div><p className="font-bold text-sm">{moderator.name}</p><p className="text-xs text-gray-500">{moderator.email}</p><p className="text-[10px] text-gray-400 mt-1">Added {new Date(moderator.createdAt).toLocaleDateString()}</p></div><button onClick={() => removeModerator(moderator)} className="px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg">Remove access</button></div>)}</div> : <p className="text-center py-10 text-gray-500 text-sm">No moderator accounts yet</p>}
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="space-y-8">
                  <section>
                    <h3 className="font-bold text-gray-900 mb-3">🎫 Support tickets ({supportTickets.length})</h3>
                    {supportTickets.length ? <div className="space-y-3">
                      {supportTickets.map(ticket => (
                        <div key={ticket._id} className="border rounded-xl p-4">
                          <div className="flex justify-between gap-3 flex-wrap"><div><p className="font-bold text-sm">{ticket.subject}</p><p className="text-xs text-gray-500">{ticket.user?.name} • {ticket.user?.email} • #{ticket._id.slice(-6).toUpperCase()}</p></div><span className={`text-xs px-2 py-1 h-fit rounded-full ${ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{ticket.status} / {ticket.priority}</span></div>
                          <p className="text-sm text-gray-700 mt-3 whitespace-pre-line bg-gray-50 p-3 rounded-lg max-h-36 overflow-y-auto">{ticket.message}</p>
                          {ticket.replies?.length > 0 && <div className="mt-3 space-y-2">{ticket.replies.slice(-4).map(reply => <div key={reply._id} className={`text-xs p-2 rounded-lg ${reply.from?.role === 'admin' || reply.from?.role === 'moderator' ? 'bg-green-50 text-green-800 ml-5' : 'bg-orange-50 text-orange-800 mr-5'}`}><strong>{reply.from?.name || 'User'}:</strong> {reply.message}</div>)}</div>}
                          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap"><p className="text-xs text-gray-400">{new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}</p><div className="flex gap-2"><button onClick={() => handleSupportReply(ticket)} disabled={ticket.status === 'closed'} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg disabled:opacity-40">Reply</button>{ticket.status !== 'resolved' && <button onClick={() => handleTicketStatus(ticket, 'resolved')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">Resolve</button>}{ticket.status !== 'closed' && <button onClick={() => handleTicketStatus(ticket, 'closed')} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">Close</button>}</div></div>
                        </div>
                      ))}
                    </div> : <p className="text-center py-6 text-gray-500 text-sm">No support tickets</p>}
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-3">💬 Buyer–seller conversations ({adminChats.length})</h3>
                    {adminChats.length ? <div className="space-y-3">
                      {adminChats.map(chat => {
                        const lastMessage = chat.messages?.[chat.messages.length - 1]
                        return <div key={chat._id} className="border rounded-xl p-4">
                          <div className="flex justify-between gap-3"><div><p className="font-bold text-sm">{chat.product?.title || 'Support conversation'}</p><p className="text-xs text-gray-500">{chat.participants?.map(person => person.sellerProfile?.storeName || person.name).join(' ↔ ')}</p></div><span className="text-xs text-gray-400">{chat.isOpen ? 'Open' : 'Closed'}</span></div>
                          <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg">{lastMessage?.message || 'No messages'}</p>
                          {lastMessage?.createdAt && <p className="text-xs text-gray-400 mt-2">Last activity: {new Date(lastMessage.createdAt).toLocaleString()}</p>}
                        </div>
                      })}
                    </div> : <p className="text-center py-6 text-gray-500 text-sm">No buyer–seller conversations</p>}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Profile Page with Store Name separate from Full Name
const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '', storeName: '', storeDescription: '', returnPolicy: '', pickupAddress: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setForm({ 
      name: user.name || '', 
      phone: user.phone || '', 
      street: user.address?.street || '', 
      city: user.address?.city || '', 
      state: user.address?.state || '',
      storeName: user.sellerProfile?.storeName || '',
      storeDescription: user.sellerProfile?.description || '',
      returnPolicy: user.sellerProfile?.returnPolicy || '',
      pickupAddress: user.sellerProfile?.pickupAddress || ''
    })
  }, [user, navigate])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, 
        body: JSON.stringify(form) 
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) { updateUser(data.data.user); setToast({ message: '✓ Profile updated!', type: 'success' }) }
      else setToast({ message: data.message || 'Failed', type: 'error' })
    } catch { setLoading(false); setToast({ message: 'Failed to update', type: 'error' }) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setToast({ message: '✓ Password changed successfully', type: 'success' })
      } else setToast({ message: data.message || 'Unable to change password', type: 'error' })
    } catch { setLoading(false); setToast({ message: 'Unable to connect to the server', type: 'error' }) }
  }

  if (!user) return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">👤 My Profile</h1>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-orange-600">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">{user.name}</h2>
                {user.sellerProfile?.storeName && (
                  <p className="text-sm text-blue-600">🏪 {user.sellerProfile.storeName}</p>
                )}
                <p className="text-gray-500 text-sm">{user.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('info')} className={`px-4 sm:px-6 py-3 font-medium text-sm ${activeTab === 'info' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📝 Personal Info</button>
              <button onClick={() => setActiveTab('address')} className={`px-4 sm:px-6 py-3 font-medium text-sm ${activeTab === 'address' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>📍 Address</button>
              {user.role === 'seller' && (
                <button onClick={() => setActiveTab('store')} className={`px-4 sm:px-6 py-3 font-medium text-sm ${activeTab === 'store' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🏪 Store</button>
              )}
              <button onClick={() => setActiveTab('security')} className={`px-4 sm:px-6 py-3 font-medium text-sm ${activeTab === 'security' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🔒 Security</button>
            </div>
            
            <div className="p-4 sm:p-6">
              {activeTab === 'info' && (
                <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email (read-only)</label>
                    <input value={user.email} disabled className="w-full px-4 py-3 border border-gray-200 rounded bg-gray-50 text-gray-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="09051103883" />
                  </div>
                  {user.referralCode && <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg"><p className="text-xs text-purple-700">Your referral code</p><div className="flex items-center justify-between gap-2 mt-1"><strong className="text-purple-900 tracking-wider">{user.referralCode}</strong><button type="button" onClick={() => { navigator.clipboard.writeText(user.referralCode); setToast({ message: 'Referral code copied', type: 'success' }) }} className="text-xs font-bold text-purple-700">Copy</button></div><p className="text-[10px] text-purple-600 mt-1">Rewards activate only after a referred user completes a verified paid order.</p></div>}
                  <button type="submit" disabled={loading} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base">{loading ? 'Updating...' : '✓ Update Profile'}</button>
                </form>
              )}
              
              {activeTab === 'address' && (
                <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
                    <input value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                      <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                      <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base">
                    {loading ? 'Updating...' : '✓ Update Address'}
                  </button>
                </form>
              )}

              {activeTab === 'store' && user.role === 'seller' && (
                <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Store Name</label>
                    <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Your store/business name" />
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Store Description</label><textarea value={form.storeDescription} onChange={e => setForm({...form, storeDescription: e.target.value})} rows={4} maxLength={1000} className="w-full px-4 py-3 border rounded-lg text-sm" placeholder="Tell buyers what your store sells and why they can trust your service." /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Store Return Policy</label><textarea value={form.returnPolicy} onChange={e => setForm({...form, returnPolicy: e.target.value})} rows={3} maxLength={1500} className="w-full px-4 py-3 border rounded-lg text-sm" placeholder="State truthful return conditions and time limits." /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Information</label><input value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-sm" placeholder="Safe public pickup area (do not publish a private home address)" /></div>
                  <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-700">📋 These details appear on your public, shareable store page. Only publish information you can honour.</p></div>
                  <div className="flex flex-wrap gap-2"><button type="submit" disabled={loading} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base">{loading ? 'Updating...' : '✓ Update Store'}</button>{user.sellerProfile?.isApproved && <button type="button" onClick={() => navigate(`/stores/${user._id}`)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm">View Public Store</button>}</div>
                </form>
              )}
              
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-bold text-red-900 mb-1">🔐 Protect your account</h4>
                    <p className="text-xs text-red-700">Use a unique password. If this was a demo account, change the old public password immediately.</p>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Current password</label><input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">New password</label><input type="password" autoComplete="new-password" minLength={10} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="10+ characters with uppercase, lowercase and number" required /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Confirm new password</label><input type="password" autoComplete="new-password" minLength={10} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required /></div>
                  <button type="submit" disabled={loading} className="px-5 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black disabled:opacity-50">{loading ? 'Changing...' : 'Change Password'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Public information and policy pages. Review with a Nigerian lawyer before live payments.
const InformationPage = ({ type }) => {
  const pages = {
    about: {
      icon: '🇳🇬', title: 'About Campus Market', intro: 'A growing multi-vendor marketplace built for campus communities and open to buyers and sellers across Nigeria.',
      sections: [
        ['Our purpose', 'We help local sellers present products professionally, reach customers outside their immediate community and manage enquiries, orders and delivery information in one place.'],
        ['Who can use it', 'Students, staff, families, professionals, independent sellers and shoppers from any Nigerian state may use the marketplace, subject to account and listing rules.'],
        ['How it works', 'Sellers create listings with images and delivery details. Admins review listings. Buyers compare products, chat with sellers and place orders for local or nationwide delivery.']
      ]
    },
    terms: {
      icon: '📄', title: 'Terms of Use', intro: 'These basic terms explain responsible use of Campus Market. They must be legally reviewed before full commercial launch.',
      sections: [
        ['Accounts', 'Provide accurate information, protect your password and do not create accounts for fraud, impersonation or prohibited activity.'],
        ['Listings', 'Sellers must own or be authorised to sell listed items. Images, condition, price, stock, location and delivery details must be accurate. Misleading and counterfeit listings may be removed.'],
        ['Orders and payment', 'Until verified Flutterwave payments are activated, orders use Pay on Delivery. Never transfer to a hard-coded account or share an OTP, PIN or card details with another user.'],
        ['Marketplace role', 'Campus Market connects buyers and independent sellers. Sellers remain responsible for product legality, accuracy, fulfilment, warranties and delivery commitments.'],
        ['Enforcement', 'Accounts and listings may be restricted while fraud, safety complaints, prohibited items or policy violations are investigated.']
      ]
    },
    privacy: {
      icon: '🔐', title: 'Privacy Notice', intro: 'We collect only the information needed to operate accounts, orders, support, seller tools and marketplace safety.',
      sections: [
        ['Information collected', 'This can include your name, email, phone number, address, account role, listings, chats, orders, reports and basic technical logs.'],
        ['How information is used', 'Information is used to provide the service, calculate delivery, prevent abuse, respond to support requests, review sellers and improve marketplace performance.'],
        ['Information sharing', 'Order details are shared only with the buyer, relevant seller and authorised administrators as needed. We do not publicly display private addresses or bank details.'],
        ['Security and retention', 'Reasonable technical controls are used, but no online service is risk-free. Information is retained only as needed for operations, disputes and legal obligations.'],
        ['Your choices', 'You may request correction or deletion of eligible personal information through the in-app Support chat. Some transaction or dispute records may need to be retained.']
      ]
    },
    returns: {
      icon: '↩️', title: 'Returns, Refunds and Disputes', intro: 'Inspect products carefully and report a problem from My Orders as soon as possible.',
      sections: [
        ['Before accepting delivery', 'Check that the item, quantity and visible condition match the listing. For Pay on Delivery, do not pay until you have made a reasonable inspection.'],
        ['Reportable problems', 'Examples include non-delivery, wrong item, counterfeit item, serious undisclosed damage or a product that materially differs from its description.'],
        ['How to report', 'Open My Orders, select Report Issue / Request Refund and describe the problem with clear evidence. Admins can review the order and conversation.'],
        ['Current payment limitation', 'Automatic online refunds will be added with verified Flutterwave payments. Until then, a report helps document and mediate the issue but is not a guarantee that the platform can reverse a direct or cash payment.'],
        ['Excluded cases', 'Change-of-mind returns, damage after acceptance and issues clearly disclosed in the listing may depend on the seller’s stated policy.']
      ]
    },
    safety: {
      icon: '🛡️', title: 'Marketplace Safety', intro: 'Use these rules for safer local and interstate transactions.',
      sections: [
        ['Protect your account', 'Never share your password, OTP, transfer PIN, card PIN or CVV. Campus Market support will not ask for them.'],
        ['Pay safely', 'The current method is Pay on Delivery. Do not transfer to an account displayed in a screenshot, chat message or old payment page.'],
        ['Local pickup', 'Meet in a safe public location during daylight, tell someone where you are going and inspect the product before paying.'],
        ['Interstate delivery', 'Confirm seller identity, listing history, delivery method, tracking and return terms. Use tracked logistics where possible.'],
        ['Report suspicious activity', 'Use the order report or support chat for impersonation, counterfeit products, payment pressure, threats or requests to move a transaction outside the platform.']
      ]
    }
  }
  const page = pages[type] || pages.about
  return (
    <div className="min-h-screen bg-gray-100 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-gray-950 to-gray-800 text-white rounded-2xl p-6 sm:p-10 mb-6">
          <span className="text-4xl">{page.icon}</span><h1 className="text-2xl sm:text-4xl font-black mt-3">{page.title}</h1><p className="text-gray-300 mt-3 leading-relaxed">{page.intro}</p>
        </div>
        <div className="space-y-4">
          {page.sections.map(([title, body]) => <section key={title} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6"><h2 className="font-bold text-gray-900 text-lg">{title}</h2><p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-2">{body}</p></section>)}
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">Last updated: July 2026 • Use the in-app Support chat for questions.</p>
      </div>
    </div>
  )
}

// Footer
const Footer = () => {
  const navigate = useNavigate()
  return (
    <footer style={{ backgroundColor: colors.dark }} className="text-gray-300 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white rounded px-2 py-1"><span style={{ color: colors.primary }} className="font-bold text-sm">CM</span></div>
              <span className="font-bold text-white text-sm sm:text-base">Campus Market</span>
            </div>
            <p className="text-xs sm:text-sm">A growing Nigerian marketplace built for campus communities and open to shoppers nationwide.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><button onClick={() => navigate('/products')} className="hover:text-orange-400">All Products</button></li>
              <li><button onClick={() => navigate('/wishlist')} className="hover:text-orange-400">Wishlist</button></li>
              <li><button onClick={() => navigate('/orders')} className="hover:text-orange-400">My Orders</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm sm:text-base">Categories</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><button onClick={() => navigate('/products?category=phones-accessories')} className="hover:text-orange-400">Phones</button></li>
              <li><button onClick={() => navigate('/products?category=electronics')} className="hover:text-orange-400">Electronics</button></li>
              <li><button onClick={() => navigate('/products?category=fashion')} className="hover:text-orange-400">Fashion</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm sm:text-base">Help & Policies</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><button onClick={() => navigate('/about')} className="hover:text-orange-400">About Us</button></li>
              <li><button onClick={() => navigate('/safety')} className="hover:text-orange-400">Marketplace Safety</button></li>
              <li><button onClick={() => navigate('/returns')} className="hover:text-orange-400">Returns & Disputes</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-orange-400">Privacy</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-orange-400">Terms</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>🤖 AI help with human escalation</li>
              <li>📱 09051103883</li>
              <li>💬 Live Chat Available</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} Campus Market. All rights reserved. | 🇳🇬 Open to buyers and sellers across Nigeria | 🔒 SSL Protected</p>
        </div>
      </div>
    </footer>
  )
}

// Main App with all providers
function App() {
  return (
    <AuthProvider>
      <RecentlyViewedProvider>
        <WishlistProvider>
          <NotificationProvider>
            <ChatProvider>
              <CartProvider>
                <div className="min-h-screen flex flex-col bg-gray-100">
                  <ScrollToTop />
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/stores/:sellerId" element={<StorePage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                      <Route path="/orders" element={<MyOrdersPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/about" element={<InformationPage type="about" />} />
                      <Route path="/terms" element={<InformationPage type="terms" />} />
                      <Route path="/privacy" element={<InformationPage type="privacy" />} />
                      <Route path="/returns" element={<InformationPage type="returns" />} />
                      <Route path="/safety" element={<InformationPage type="safety" />} />
                      <Route path="/seller" element={<SellerDashboard />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-6xl block mb-4">🔍</span>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-400 mb-4">404 - Page Not Found</h1>
                            <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">Go to Homepage</button>
                          </div>
                        </div>
                      } />
                    </Routes>
                  </main>
                  <Footer />
                  <SupportChat />
                </div>
              </CartProvider>
            </ChatProvider>
          </NotificationProvider>
        </WishlistProvider>
      </RecentlyViewedProvider>
    </AuthProvider>
  )
}

export default App