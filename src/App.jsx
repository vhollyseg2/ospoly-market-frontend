import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'

const API_URL = 'https://ospoly-market-api.onrender.com'

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
  
  const addNotification = (notification) => {
    const newNotif = { ...notification, id: Date.now(), read: false, createdAt: new Date() }
    setNotifications(prev => [newNotif, ...prev])
  }
  
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  
  const clearAll = () => setNotifications([])
  
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Chat Provider for Buyer-Seller-Admin communication
const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState({})
  const [activeChat, setActiveChat] = useState(null)
  const { user } = useContext(AuthContext)
  
  const fetchChats = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/chat/chats`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setChats(data.data.chats || {})
    } catch {}
  }
  
  const sendMessage = async (recipientId, message, type = 'buyer_to_seller') => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId, message, type })
      })
    } catch {}
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
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, shipping: 500, total: 500 })
  
  const fetchCart = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) { 
        setItems(data.data.cart?.items || [])
        // Calculate dynamic shipping based on subtotal
        const subtotal = data.data.summary?.subtotal || 0
        let shippingFee = 500
        if (subtotal >= 50000) shippingFee = 0
        else if (subtotal >= 25000) shippingFee = 250
        else if (subtotal >= 10000) shippingFee = 350
        
        setSummary({
          ...data.data.summary,
          shipping: shippingFee,
          total: (data.data.summary?.subtotal || 0) + shippingFee
        })
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
        const subtotal = data.data.summary.subtotal
        let shippingFee = 500
        if (subtotal >= 50000) shippingFee = 0
        else if (subtotal >= 25000) shippingFee = 250
        else if (subtotal >= 10000) shippingFee = 350
        setSummary({ ...data.data.summary, shipping: shippingFee, total: subtotal + shippingFee })
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
        const subtotal = data.data.summary.subtotal
        let shippingFee = 500
        if (subtotal >= 50000) shippingFee = 0
        else if (subtotal >= 25000) shippingFee = 250
        else if (subtotal >= 10000) shippingFee = 350
        setSummary({ ...data.data.summary, shipping: shippingFee, total: subtotal + shippingFee })
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
        const subtotal = data.data.summary.subtotal
        let shippingFee = 500
        if (subtotal >= 50000) shippingFee = 0
        else if (subtotal >= 25000) shippingFee = 250
        else if (subtotal >= 10000) shippingFee = 350
        setSummary({ ...data.data.summary, shipping: shippingFee, total: subtotal + shippingFee })
      }
    } catch {}
  }
  
  const clearCart = async () => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch(`${API_URL}/api/cart/clear`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setItems([])
      setSummary({ itemCount: 0, subtotal: 0, shipping: 500, total: 500 })
    } catch {}
  }
  
  useEffect(() => { fetchCart() }, [])
  
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
    '🎉 FREE SHIPPING on orders above ₦50,000!',
    '⚡ FLASH SALE: Up to 50% off on Electronics!',
    '🏪 Become a seller and earn today!',
    '🛡️ 100% Buyer Protection on all orders'
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
  const { notifications, markAsRead } = useNotifications()
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
            <button onClick={() => setOpen(false)} className="text-gray-500">✕</button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">🔔</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map(n => (
                <div key={n.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-orange-50' : ''}`} onClick={() => markAsRead(n.id)}>
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
      await fetch(`${API_URL}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, title, comment, aspectRatings })
      })
    } catch {}
    
    setLoading(false)
    setToast({ message: '✓ Review submitted successfully!', type: 'success' })
    
    setTimeout(() => {
      onSubmit?.({ rating, title, comment, aspectRatings })
      onClose()
    }, 1500)
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
            <span className="text-xs text-green-700">Verified Purchase - Your review will help other buyers</span>
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

// Secure Payment Modal - FIXED with seller name for transfer
const PaymentModal = ({ isOpen, onClose, amount, orderId, orderItems, onSuccess }) => {
  const { user } = useAuth()
  const [method, setMethod] = useState('card')
  const [loading, setLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [toast, setToast] = useState(null)
  const [showRefundPolicy, setShowRefundPolicy] = useState(false)
  const [transactionId, setTransactionId] = useState(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  
  // Get seller name from order items for transfer section
  const getSellerName = () => {
    if (orderItems && orderItems.length > 0) {
      return orderItems[0]?.sellerName || 'the seller'
    }
    return 'the seller'
  }
  
  if (!isOpen) return null
  
  const generateTransactionId = () => 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const verifyPayment = async (txnId) => {
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${API_URL}/api/payments/verify/${txnId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      return data.success && data.data?.verified
    } catch {
      return false
    }
  }
  
  const handlePayment = async () => {
    setLoading(true)
    
    if (method === 'card') {
      if (cardDetails.number.replace(/\s/g, '').length < 16 || cardDetails.cvv.length < 3) {
        setToast({ message: 'Invalid card details', type: 'error' })
        setLoading(false)
        return
      }
    }
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newTxnId = generateTransactionId()
    setTransactionId(newTxnId)
    
    // For transfer method, require manual confirmation
    if (method === 'transfer') {
      setLoading(false)
      setToast({ message: 'Transfer to the account below and click "I Have Paid" to confirm', type: 'info' })
      return
    }
    
    // For card, simulate verification
    const verified = await verifyPayment(newTxnId)
    if (verified) {
      setPaymentConfirmed(true)
      try {
        await fetch(`${API_URL}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: JSON.stringify({ orderId, transactionId: newTxnId, amount, method, status: 'completed', timestamp: new Date().toISOString() })
        })
      } catch {}
      setLoading(false)
      setToast({ message: '✓ Payment verified and processed!', type: 'success' })
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } else {
      setLoading(false)
      setToast({ message: 'Payment verification failed. Please try again.', type: 'error' })
    }
  }
  
  const handleConfirmTransfer = async () => {
    if (!transactionId) {
      setToast({ message: 'Please wait for transaction ID', type: 'error' })
      return
    }
    setLoading(true)
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const verified = await verifyPayment(transactionId)
    if (verified) {
      setPaymentConfirmed(true)
      try {
        await fetch(`${API_URL}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: JSON.stringify({ orderId, transactionId, amount, method: 'transfer', status: 'completed', timestamp: new Date().toISOString() })
        })
      } catch {}
      setLoading(false)
      setToast({ message: '✓ Transfer confirmed and verified!', type: 'success' })
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } else {
      setLoading(false)
      setToast({ message: 'Transfer not yet confirmed. Please verify with your bank.', type: 'error' })
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">💳 Secure Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <span className="text-green-600 text-xl">🔒</span>
          <div>
            <p className="text-sm font-bold text-green-800">256-bit SSL Encrypted</p>
            <p className="text-xs text-green-600">Your payment is fully secured</p>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg mb-4">
          <p className="text-gray-600 text-sm">Amount to pay</p>
          <p className="text-2xl font-bold text-orange-600">₦{amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Order: #{orderId?.slice(-8).toUpperCase()}</p>
          {transactionId && <p className="text-xs text-gray-500">TXN: {transactionId}</p>}
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { key: 'card', icon: '💳', label: 'Card' },
            { key: 'transfer', icon: '🏦', label: 'Transfer' },
            { key: 'ussd', icon: '📱', label: 'USSD' },
            { key: 'wallet', icon: '👛', label: 'Wallet' }
          ].map(({ key, icon, label }) => (
            <button key={key} onClick={() => setMethod(key)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${method === key ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <span className="text-2xl block mb-1">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
        
        {method === 'card' && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Card Number</label>
              <input type="text" maxLength={19} value={cardDetails.number}
                onChange={e => setCardDetails({...cardDetails, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()})}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Cardholder Name</label>
              <input type="text" value={cardDetails.name}
                onChange={e => setCardDetails({...cardDetails, name: e.target.value.toUpperCase()})}
                placeholder="JOHN DOE"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Expiry</label>
                <input type="text" maxLength={5} value={cardDetails.expiry}
                  onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">CVV</label>
                <input type="password" maxLength={4} value={cardDetails.cvv}
                  onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                  placeholder="•••"
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" />
              </div>
            </div>
          </div>
        )}
        
        {method === 'transfer' && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Transfer to:</p>
            <p className="text-sm font-bold text-gray-800">{getSellerName()} - First Bank</p>
            <p className="text-lg font-mono text-orange-600">3056789012</p>
            <p className="text-xs text-gray-500 mt-2">Use order ID as payment reference: #{orderId?.slice(-8).toUpperCase()}</p>
            {transactionId && !paymentConfirmed && (
              <button onClick={handleConfirmTransfer} disabled={loading}
                className="w-full mt-3 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 disabled:opacity-50">
                {loading ? 'Verifying...' : '✓ I Have Paid - Confirm Transfer'}
              </button>
            )}
          </div>
        )}
        
        {method === 'ussd' && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Dial this USSD code:</p>
            <p className="text-2xl font-bold text-orange-600">*894#</p>
            <p className="text-xs text-gray-500 mt-2">Follow the prompts and enter amount: ₦{amount?.toLocaleString()}</p>
          </div>
        )}
        
        {method === 'wallet' && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Pay with Wallet Balance</p>
            <p className="text-lg font-bold text-gray-800">Available: ₦{(user?.walletBalance || 0).toLocaleString()}</p>
            {user?.walletBalance < amount && (
              <p className="text-xs text-red-500 mt-2">Insufficient balance. Please add funds or use another method.</p>
            )}
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <button onClick={() => setShowRefundPolicy(!showRefundPolicy)} className="flex items-center justify-between w-full text-sm">
            <span className="font-bold text-blue-800">🛡️ Buyer Protection & Refund Policy</span>
            <span>{showRefundPolicy ? '▲' : '▼'}</span>
          </button>
          {showRefundPolicy && (
            <div className="mt-3 text-xs text-blue-700 space-y-2">
              <p>• Full refund if seller doesn't deliver within 7 days</p>
              <p>• Partial refund for damaged/incorrect items (50-100%)</p>
              <p>• Report scams within 48 hours of delivery issue</p>
              <p>• Disputes handled by admin within 24 hours</p>
              <p>• Refund processed within 3-5 business days</p>
              <p className="font-bold">• Escrow protection - payment held until delivery confirmed</p>
            </div>
          )}
        </div>
        
        {method !== 'transfer' && (
          <button onClick={handlePayment} disabled={loading || paymentConfirmed}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-base">
            {loading ? '🔒 Processing...' : paymentConfirmed ? '✓ Payment Complete' : `🔒 Pay ₦${amount?.toLocaleString()} Securely`}
          </button>
        )}
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <span>🔒 SSL</span><span>✓ PCI</span><span>🛡️ Insured</span>
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

// AI Support Chat - FIXED to send to admin/moderator only
const SupportChat = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'system', text: '🤖 AI Assistant: Welcome to Ospoly Market Support! I\'m here to help 24/7. How can I assist you today?', time: new Date() }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [toast, setToast] = useState(null)
  
  const quickReplies = ['Track my order', 'Return/refund', 'Product inquiry', 'Seller question', 'Payment issue']
  
  // AI responses for common questions
  const getAIResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase()
    
    if (lowerMsg.includes('track') || lowerMsg.includes('order')) {
      return 'You can track your order from the "My Orders" page in your account. Click on any order to see its current status: Pending → Confirmed → Processing → Shipped → Delivered. Is there a specific order issue I can help with? 📦'
    }
    if (lowerMsg.includes('refund') || lowerMsg.includes('return')) {
      return 'To request a refund: 1) Go to "My Orders", 2) Click "Report Issue" on the order, 3) Describe the problem. Admin will review within 24 hours and process your refund within 3-5 business days. 💸'
    }
    if (lowerMsg.includes('payment')) {
      return 'We accept Card, Bank Transfer, USSD, and Wallet payments. All payments are secured with escrow protection - your money is held safely until delivery is confirmed. 🔒'
    }
    if (lowerMsg.includes('seller') || lowerMsg.includes('become')) {
      return 'To become a seller: 1) Create an account, 2) Register as a seller, 3) Wait for admin approval (usually within 24 hours). Once approved, you can list products from your dashboard! 🚀'
    }
    if (lowerMsg.includes('delivery') || lowerMsg.includes('shipping')) {
      return 'Delivery times vary by location. Lagos: 1-3 days, Other states: 3-5 days. Orders above ₦50,000 get FREE shipping! 🚚'
    }
    if (lowerMsg.includes('scam') || lowerMsg.includes('report')) {
      return 'If you\'ve been scammed, report immediately via "Report Issue" on your order or contact admin at admin@ospolymarket.com within 48 hours for investigation. 🛡️'
    }
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('help')) {
      return 'Hello! I\'m your AI support assistant. I can help with: order tracking, refunds, payment issues, seller inquiries, and general questions. What can I help you with? 😊'
    }
    
    return 'Thanks for your message! For specific issues, I\'ll forward this to our admin team who will respond within 1-2 hours. For urgent matters, call 09051103883 📞'
  }
  
  const handleSend = () => {
    if (!newMessage.trim()) return
    
    const userMsg = newMessage
    setMessages(prev => [...prev, { from: 'user', text: userMsg, time: new Date() }])
    setNewMessage('')
    
    // AI responds immediately
    setTimeout(() => {
      const aiResponse = getAIResponse(userMsg)
      setMessages(prev => [...prev, { from: 'ai', text: aiResponse, time: new Date() }])
    }, 800)
    
    // Forward to admin for serious issues
    if (userMsg.toLowerCase().includes('scam') || userMsg.toLowerCase().includes('report') || userMsg.toLowerCase().includes('problem')) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        fetch(`${API_URL}/api/support/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subject: 'User Support Request', message: userMsg, priority: 'high' })
        }).catch(() => {})
      }
    }
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      {open && (
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 mb-2 border border-gray-200">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-bold">AI Support</p>
                <p className="text-xs text-orange-100">Powered by AI + Admin Backup</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white text-xl">✕</button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.from === 'user' ? 'bg-orange-500 text-white' : 
                  msg.from === 'ai' ? 'bg-white border border-gray-200 text-gray-800' : 
                  'bg-gray-200 text-gray-600 text-center mx-auto'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-2 border-t bg-white rounded-b-xl">
            <div className="flex flex-wrap gap-1 mb-2">
              {quickReplies.map(reply => (
                <button key={reply} onClick={() => setNewMessage(reply)}
                  className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                  {reply}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:border-orange-500" />
              <button onClick={handleSend} className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button onClick={() => setOpen(!open)} 
        className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:from-orange-600 hover:to-red-600 transition-all hover:scale-110">
        {open ? '✕' : '🤖'}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />}
      </button>
    </div>
  )
}

// Product-Seller Chat Component
const ProductChat = ({ sellerId, productTitle }) => {
  const { user } = useAuth()
  const { sendMessage } = useChat()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState(null)
  
  const handleSend = async () => {
    if (!message.trim()) return
    if (!user) {
      setToast({ message: 'Please login first', type: 'error' })
      return
    }
    
    await sendMessage(sellerId, message, 'buyer_to_seller')
    setToast({ message: '✓ Message sent to seller!', type: 'success' })
    setMessage('')
    setOpen(false)
  }
  
  if (!user) return null
  
  return (
    <div>
      <button onClick={() => setOpen(true)} className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded hover:bg-blue-600">
        💬 Chat with Seller
      </button>
      
      {open && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          {toast && <Toast {...toast} onClose={() => setToast(null)} />}
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">💬 Chat with Seller</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Re: {productTitle}</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-4 text-sm" rows={4}
              placeholder="Type your message to the seller..." />
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 bg-gray-300 text-gray-700 font-bold rounded">Cancel</button>
              <button onClick={handleSend} className="flex-1 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600">Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Header Component
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { summary } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)

  const searchParams = new URLSearchParams(location.search)
  const currentCategory = searchParams.get('category') || ''

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
      
      {/* Announcement Bar */}
      <AnnouncementBar />
      
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="hidden md:block" style={{ backgroundColor: colors.dark }}>
          <div className="px-4 py-2 flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-4 text-white text-xs">
              <span>📞 09051103883</span>
              <span>🚚 Free Shipping on orders ₦50,000+</span>
              <span>🛡️ 100% Buyer Protection</span>
            </div>
            <div className="flex items-center gap-4 text-white text-xs">
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="hover:text-orange-400">📦 My Orders</Link>
                  <Link to="/profile" className="hover:text-orange-400">👤 Profile</Link>
                  <Link to="/wishlist" className="hover:text-orange-400 flex items-center gap-1">❤️ Wishlist ({wishlist.length})</Link>
                  <span className="text-orange-400">✋ {user?.name}</span>
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
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white text-2xl">{mobileMenuOpen ? '✕' : '☰'}</button>
              
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white rounded-lg px-3 py-2 shadow">
                  <img src="/logo.png" alt="Ospoly Market" className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                    onError={(e) => e.target.style.display = 'none'} />
                  <span style={{ color: colors.primary }} className="font-bold text-lg sm:text-xl hidden">OM</span>
                </div>
                <div className="hidden sm:block text-white">
                  <span className="font-bold text-lg block leading-tight">Ospoly</span>
                  <span className="text-xs text-orange-200">Market</span>
                </div>
              </Link>
              
              <form onSubmit={handleSearch} className="flex-1 max-w-xl sm:max-w-2xl">
                <div className="flex">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search products, stores, brands..." 
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg text-sm focus:outline-none w-full" />
                  <button type="submit" className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white font-bold rounded-r-lg hover:bg-red-700 transition-colors text-sm">🔍</button>
                </div>
              </form>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/wishlist" className="hidden sm:flex items-center gap-2 text-white relative">
                  <span className="text-xl">❤️</span>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
                
                <Link to="/cart" className="relative hidden sm:flex items-center gap-2 text-white">
                  <div className="bg-red-600 rounded-lg px-3 py-2"><span className="text-lg">🛒</span></div>
                  {summary.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {summary.itemCount}
                    </span>
                  )}
                </Link>
                
                {isAuthenticated ? (
                  <div className="hidden md:flex items-center gap-3">
                    <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-orange-600 font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="hidden md:block px-4 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm">Sign In</Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
          <Link to="/cart" className="flex items-center gap-2 text-gray-700">
            <span>🛒</span><span className="text-sm">Cart</span>
            {summary.itemCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{summary.itemCount}</span>}
          </Link>
          <Link to="/wishlist" className="flex items-center gap-2 text-gray-700">
            <span>❤️</span><span className="text-sm">Wishlist</span>
            {wishlist.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{wishlist.length}</span>}
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-sm text-gray-700">👤</Link>
              <button onClick={handleLogout} className="text-sm text-orange-600">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-orange-600 font-medium">Sign In</Link>
          )}
        </div>
        
        <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}` }} className="overflow-x-auto">
          <div className="px-4 flex items-center gap-1 py-2 min-w-max">
            <Link to="/products" className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              !currentCategory ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>All</Link>
            <button onClick={() => navigate('/products?category=phones-accessories')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              currentCategory === 'phones-accessories' ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>📱 Phones</button>
            <button onClick={() => navigate('/products?category=electronics')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              currentCategory === 'electronics' ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>🎧 Electronics</button>
            <button onClick={() => navigate('/products?category=furniture')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              currentCategory === 'furniture' ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>🪑 Furniture</button>
            <button onClick={() => navigate('/products?category=fashion')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              currentCategory === 'fashion' ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>👕 Fashion</button>
            <button onClick={() => navigate('/products?category=kitchen-home')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
              currentCategory === 'kitchen-home' ? 'text-orange-600 border-orange-600' : 'text-gray-700 border-transparent hover:text-orange-600'
            }`}>🏠 Apartment</button>
            <button onClick={() => navigate('/products?flash=true')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap text-red-600 hover:bg-red-50 rounded">
              ⚡ Flash Deals
            </button>
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <Link to="/seller" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">🏪 Seller</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 whitespace-nowrap">⚙️ Admin</Link>
            )}
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-4 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">🏠 Home</Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">📦 All Products</Link>
            <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">❤️ Wishlist</Link>
            {isAuthenticated && <><Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">📦 Orders</Link><Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">👤 Profile</Link></>}
          </div>
        )}
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
        className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer relative group"
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
        
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden p-4">
          <span className="text-5xl sm:text-6xl opacity-50">📦</span>
          
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
          
          <div className="flex items-center gap-1 sm:gap-3 text-xs text-gray-500 mb-2 sm:mb-3">
            <span className="text-yellow-500">⭐ {product.rating || 0}</span>
            <span className="hidden sm:inline">|</span>
            <span>{product.reviewCount || 0} sold</span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-red-500">| Only {product.stock} left!</span>
            )}
          </div>
          
          <button onClick={handleAddToCart} 
            className="w-full py-2 bg-orange-500 text-white text-xs sm:text-sm font-bold rounded hover:bg-orange-600 transition-colors">
            🛒 Add to Cart
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
      {/* Hero Section with Background Image */}
      <div 
        className="py-8 sm:py-12 px-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255,115,0,0.9) 0%, rgba(255,85,0,0.9) 100%)`,
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,160L48,165.3C96,171,192,181,288,186.7C384,192,480,192,576,181.3C672,171,768,149,864,149.3C960,149,1056,171,1152,176C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>')`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom'
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="text-white text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Shop Direct from Campus Vendors
              </h1>
              <p className="text-sm sm:text-base text-orange-100 mb-4 sm:mb-6">
                Quality products at unbeatable prices. Verified sellers, secure payments, fast delivery. 🛡️ 100% Buyer Protection!
              </p>
              
              {/* Professional Buttons with Images */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                {isAuthenticated ? (
                  <>
                    <button onClick={() => navigate('/products')} 
                      className="group px-6 sm:px-8 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-3 shadow-lg">
                      <img src="/hero-continue.jpg" alt="" className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                      <span>🛍️ Continue Shopping</span>
                    </button>
                    {(user?.role === 'seller' || user?.role === 'admin') ? (
                      <button onClick={() => navigate('/seller')} 
                        className="group px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-orange-600 transition-all flex items-center gap-3">
                        <img src="/hero-dashboard.jpg" alt="" className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                        <span>📊 My Store</span>
                      </button>
                    ) : (
                      <button onClick={() => navigate('/seller')} 
                        className="group px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-orange-600 transition-all flex items-center gap-3">
                        <img src="/hero-seller.jpg" alt="" className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                        <span>🚀 Become Seller</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate('/products')} 
                      className="group px-6 sm:px-8 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-3 shadow-lg">
                      <img src="/hero-shopping.jpg" alt="" className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                      <span>🛍️ Shop Now</span>
                    </button>
                    <button onClick={() => navigate('/register')} 
                      className="group px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-orange-600 transition-all flex items-center gap-3">
                      <img src="/hero-seller.jpg" alt="" className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                      <span>🚀 Become a Seller</span>
                    </button>
                  </>
                )}
              </div>
              
              {/* Trust Badges */}
              <div className="flex items-center justify-center md:justify-start gap-4 mt-6 text-xs text-orange-100">
                <span className="flex items-center gap-1">🔒 Secure Payment</span>
                <span className="flex items-center gap-1">🛡️ Buyer Protection</span>
                <span className="flex items-center gap-1">✓ Verified Sellers</span>
              </div>
            </div>
            
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[
                ['📱', 'Phones', 'From ₦8,500', 'phones-accessories'], 
                ['🎧', 'Electronics', 'From ₦15,000', 'electronics'], 
                ['🪑', 'Furniture', 'From ₦35,000', 'furniture'], 
                ['👕', 'Fashion', 'From ₦5,000', 'fashion']
              ].map(([icon, name, price, cat]) => (
                <button key={name} onClick={() => navigate(`/products?category=${cat}`)} 
                  className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-xl hover:-translate-y-1 transition-all">
                  <span className="text-4xl sm:text-5xl block mb-2">{icon}</span>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">{name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{price}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>

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
                  {category === 'phones-accessories' ? '📱 Phones & Accessories' : 
                   category === 'kitchen-home' ? '🏠 Apartment & Home' : 
                   `🎧 ${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}`}
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

      {/* Trust Section */}
      <div className="py-6 sm:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            🛡️ Why Choose Ospoly Market
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              ['🚚', 'Fast Delivery', 'Quick campus delivery'], 
              ['💰', 'Secure Payment', 'Escrow protection'], 
              ['✅', 'Verified Sellers', 'Admin approved'], 
              ['💸', 'Full Refund', 'Scam protection guaranteed']
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

// Products Page with Advanced Filters
const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const flash = searchParams.get('flash') || ''

  useEffect(() => {
    setLoading(true)
    let url = `${API_URL}/api/products?limit=50`
    if (category) url += `&category=${category}`
    if (search) url += `&search=${search}`
    fetch(url).then(r => r.json()).then(d => { 
      if (d.success) setProducts(d.data.products); 
      setLoading(false) 
    })
  }, [category, search, location.search])

  const filteredProducts = products
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => (p.rating || 0) >= minRating)
    .filter(p => flash ? p.isOnFlashSale : true)
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
    if (flash) return '⚡ Flash Deals'
    if (category === 'phones-accessories') return '📱 Phones & Accessories'
    if (category === 'kitchen-home') return '🏠 Apartment & Home'
    if (category) return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
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
            
            <button onClick={() => { setPriceRange([0, 1000000]); setMinRating(0) }}
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
        addToRecentlyViewed(d.data.product)
        // Simulate reviews
        setReviews([
          { _id: '1', user: { name: 'Adebayo M.' }, rating: 5, comment: 'Great product! Fast delivery and exactly as described. Will buy again!', createdAt: new Date(Date.now() - 86400000), aspectRatings: { quality: 5, delivery: 5, communication: 5 } },
          { _id: '2', user: { name: 'Chidinma O.' }, rating: 4, comment: 'Good quality for the price. Delivery took 3 days which is acceptable.', createdAt: new Date(Date.now() - 172800000), aspectRatings: { quality: 4, delivery: 4, communication: 4 } },
          { _id: '3', user: { name: 'Emeka N.' }, rating: 5, comment: 'Excellent seller! Very responsive and product was perfect.', createdAt: new Date(Date.now() - 259200000), aspectRatings: { quality: 5, delivery: 5, communication: 5 } }
        ])
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

  const handleReviewSubmit = (reviewData) => {
    const newReview = {
      _id: Date.now().toString(),
      user: { name: user?.name || 'You' },
      ...reviewData,
      createdAt: new Date(),
      isVerified: true
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
            {/* Product Image */}
            <div className="bg-white rounded-lg p-4 sm:p-8 flex items-center justify-center relative">
              <div className="relative">
                <div className="w-64 sm:w-80 h-64 sm:h-80 bg-gray-100 rounded-lg flex items-center justify-center text-6xl sm:text-8xl">
                  📦
                </div>
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded">
                    -{discount}% OFF
                  </div>
                )}
              </div>
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
                
                {/* Buyer Protection */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-start gap-2">
                  <span className="text-blue-600">🛡️</span>
                  <div className="text-xs text-blue-700">
                    <strong>100% Buyer Protection:</strong> Full refund if seller doesn't deliver within 7 days. Report issues within 48 hours.
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
                
                {/* Save for Later */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <WishlistButton product={product} />
                  <span className="text-sm text-gray-500">Add to Wishlist</span>
                </div>
                
                {/* Chat with Seller */}
                {user && product.seller?._id && (
                  <ProductChat sellerId={product.seller._id} productTitle={product.title} />
                )}
              </div>
              
              {/* Supplier Info */}
              <div className="bg-white rounded-lg p-4 sm:p-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">🏪 Supplier</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-xl">{product.seller?.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{product.seller?.sellerProfile?.storeName || product.seller?.name}</p>
                    <p className="text-xs text-green-600">✓ Admin Verified Supplier</p>
                    <p className="text-xs text-gray-500">Rating: ⭐ {product.seller?.sellerProfile?.rating || 0}</p>
                  </div>
                  <button onClick={() => navigate(`/products?seller=${product.seller?._id}`)} 
                    className="px-3 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium hover:bg-orange-200">
                    View Store
                  </button>
                </div>
                {product.location && <p className="text-sm text-gray-500 mt-2">📍 {product.location}</p>}
              </div>
              
              {/* Description */}
              <div className="bg-white rounded-lg p-4 sm:p-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">📝 Description</h3>
                <p className="text-gray-600 text-sm sm:text-base whitespace-pre-line">{product.description}</p>
              </div>
              
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

  // Dynamic shipping message
  const getShippingMessage = () => {
    if (summary.subtotal >= 50000) return { text: 'FREE Shipping!', color: 'text-green-600' }
    if (summary.subtotal >= 25000) return { text: '₦250 shipping', color: 'text-yellow-600' }
    if (summary.subtotal >= 10000) return { text: '₦350 shipping', color: 'text-yellow-600' }
    return { text: '₦500 shipping', color: 'text-gray-600' }
  }

  const shippingMsg = getShippingMessage()

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🛒 Shopping Cart ({summary.itemCount})</h1>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map(item => (
              <div key={item.product?._id} className="bg-white rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4 border border-gray-200">
                <div className="w-20 sm:w-32 h-20 sm:h-32 bg-gray-100 rounded flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">📦</div>
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
              {summary.subtotal < 50000 && (
                <p className="text-xs text-green-600">Add ₦{(50000 - summary.subtotal).toLocaleString()} more for FREE shipping! 🎉</p>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2 sm:pt-3"><span>Total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
            </div>
            
            {/* Coupon Code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input placeholder="Coupon code" className="flex-1 px-3 py-2 border rounded text-sm" />
                <button className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded hover:bg-gray-900">Apply</button>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-green-700">🛡️ Your payment is protected. Full refund if seller doesn't deliver.</p>
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
  const [orderItems, setOrderItems] = useState([])
  const navigate = useNavigate()

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
        body: JSON.stringify({ shippingAddress: address }) 
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) { 
        setPendingOrderId(data.data.order._id)
        setOrderItems(data.data.order.items || [])
        setShowPayment(true) 
      }
      else setToast({ message: data.message || 'Order failed', type: 'error' })
    } catch { setLoading(false); setToast({ message: 'Cannot connect to server', type: 'error' }) }
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setToast({ message: '🎉 Order placed and paid successfully!', type: 'success' })
    setTimeout(() => navigate('/orders'), 2000)
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {showPayment && <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} amount={summary.total} orderId={pendingOrderId} orderItems={orderItems} onSuccess={handlePaymentSuccess} />}
      
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
                <div className="flex justify-between"><span>Shipping</span><span className="font-bold text-green-600">{summary.subtotal >= 50000 ? 'FREE' : '₦' + summary.shipping?.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span style={{ color: colors.primary }}>₦{summary.total?.toLocaleString()}</span></div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-green-700">🔒 <strong>Escrow Protection:</strong> Your payment is held safely until you confirm delivery.</p>
              </div>
              
              <button onClick={handlePlaceOrder} disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Processing...' : '💳 Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
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
                    {order.transactionId && <p className="text-xs text-gray-400">TXN: {order.transactionId}</p>}
                  </div>
                  <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex gap-3 sm:gap-4 mb-4 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded flex items-center justify-center text-2xl flex-shrink-0">📦</div>
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
                  <button onClick={() => navigate(`/products/${order.items[0]?.productId}`)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200">
                    📦 View Order Details
                  </button>
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 bg-orange-100 text-orange-600 text-xs font-medium rounded hover:bg-orange-200">
                      ✍️ Leave Review
                    </button>
                  )}
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
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-4xl mb-3">📦</div>
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
    if (result.success) navigate('/')
    else setError(result.message || 'Invalid credentials')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: colors.primary }} className="p-8 text-center">
          <div className="bg-white rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span style={{ color: colors.primary }} className="text-2xl font-bold">OM</span>
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
            <a href="#" className="text-gray-500 hover:text-orange-600">Forgot Password?</a>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-bold text-gray-700 mb-2">Demo Accounts:</p>
            <p>Buyer: buyer@ospolymarket.com</p>
            <p>Seller: seller@ospolymarket.com</p>
            <p>Admin: admin@ospolymarket.com</p>
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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer', phone: '', storeName: '' })
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
          <p className="text-orange-100 text-sm mt-1">Join Ospoly Market - It's Free!</p>
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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [productForm, setProductForm] = useState({ title: '', description: '', price: '', originalPrice: '', stock: '', category: 'phones-accessories', condition: 'new', location: '' })
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) { navigate('/login'); return }
    Promise.all([
      fetch(`${API_URL}/api/orders/seller/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/products/seller/my-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/orders/seller/orders`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
    ]).then(([statsData, productsData, ordersData]) => {
      if (statsData.success) setStats(statsData.data)
      if (productsData.success) setProducts(productsData.data.products)
      if (ordersData.success) setOrders(ordersData.data.orders)
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
    const availableBalance = user?.walletBalance || 0
    
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
        setWithdrawAmount('')
      } else {
        setToast({ message: data.message || 'Withdrawal failed', type: 'error' })
      }
    } catch {
      setWithdrawLoading(false)
      setToast({ message: 'Withdrawal failed', type: 'error' })
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      const res = await fetch(`${API_URL}/api/products`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, 
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
          stock: parseInt(productForm.stock)
        })
      })
      const data = await res.json()
      setUploading(false)
      if (data.success) {
        setToast({ message: '✓ Product submitted! Awaiting admin approval.', type: 'success' })
        setShowAddProduct(false)
        setProductForm({ title: '', description: '', price: '', originalPrice: '', stock: '', category: 'phones-accessories', condition: 'new', location: '' })
        fetch(`${API_URL}/api/products/seller/my-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
          .then(r => r.json())
          .then(d => { if (d.success) setProducts(d.data.products) })
      } else setToast({ message: data.message || 'Failed to add product', type: 'error' })
    } catch { setUploading(false); setToast({ message: 'Failed to add product', type: 'error' }) }
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
                  <p className="text-2xl font-bold text-blue-600">₦{(user?.walletBalance || 0).toLocaleString()}</p>
                </div>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Amount to Withdraw (₦)</label>
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
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
              <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">➕ Add New Product</h2>
                  <button onClick={() => setShowAddProduct(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Product Title *</label>
                    <input value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="e.g. iPhone 14 Pro Max" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" rows={4} placeholder="Describe your product..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₦) *</label>
                      <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="85000" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Original Price (₦)</label>
                      <input type="number" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="100000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Stock *</label>
                      <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="10" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                      <input value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" placeholder="Lagos" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                      <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" required>
                        <option value="phones-accessories">📱 Phones</option>
                        <option value="electronics">🎧 Electronics</option>
                        <option value="furniture">🪑 Furniture</option>
                        <option value="fashion">👕 Fashion</option>
                        <option value="kitchen-home">🏠 Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Condition *</label>
                      <select value={productForm.condition} onChange={e => setProductForm({...productForm, condition: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm" required>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                        <option value="refurbished">Refurbished</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">📋 <strong>Note:</strong> Your product will be reviewed by admin before it appears on the site.</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" disabled={uploading} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50">
                      {uploading ? 'Submitting...' : '✓ Submit for Approval'}
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
                            <th className="pb-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p._id} className="border-b text-sm">
                              <td className="py-4 pr-4">{p.title}</td>
                              <td className="py-4 pr-4 font-bold">₦{p.price?.toLocaleString()}</td>
                              <td className="py-4 pr-4">{p.stock}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {p.isApproved ? '✓ Active' : '⏳ Pending'}
                                </span>
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
                              <p className="font-bold text-sm sm:text-base">₦{order.finalAmount?.toLocaleString()}</p>
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

              {activeTab === 'wallet' && (
                <div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg mb-6">
                    <p className="text-sm opacity-80">Available Balance</p>
                    <p className="text-3xl font-bold">₦{(user?.walletBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-2">💵 Quick Withdraw</h4>
                      <button onClick={() => setShowWithdraw(true)} className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">
                        Withdraw Funds
                      </button>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-2">📊 Earning Stats</h4>
                      <p className="text-sm text-gray-600">Total Earnings: ₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Pending: ₦{(user?.pendingBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
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
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return }
    
    const fetchData = async () => {
      try {
        const [statsRes, productsRes, sellersRes, reportsRes, allProductsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()),
          fetch(`${API_URL}/api/admin/pending-products`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: true, data: { products: [] } })),
          fetch(`${API_URL}/api/admin/pending-sellers`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: true, data: { sellers: [] } })),
          fetch(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: true, data: { reports: [] } })),
          fetch(`${API_URL}/api/products?isApproved=false&limit=50`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).catch(() => ({ success: false }))
        ])
        
        if (statsRes.success) setStats(statsRes.data)
        
        // Get pending products from dedicated endpoint or fallback to filtered products
        const products = productsRes.success ? (productsRes.data.products || []) : []
        const allPending = allProductsRes.success ? (allProductsRes.data.products || []).filter(p => !p.isApproved) : []
        setPendingProducts(products.length > 0 ? products : allPending)
        
        if (sellersRes.success) setPendingSellers(sellersRes.data.sellers || [])
        if (reportsRes.success) setReports(reportsRes.data.reports || [])
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching admin data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, navigate])

  const handleApproveProduct = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: '✓ Product approved!', type: 'success' })
        setPendingProducts(prev => prev.filter(p => p._id !== productId))
      }
    } catch { setToast({ message: 'Failed to approve', type: 'error' }) }
  }

  const handleRejectProduct = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/reject`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
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
      }
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const handleProcessRefund = async (orderId, action) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/${action}`, { 
        method: 'PUT', 
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } 
      })
      const data = await res.json()
      if (data.success) { 
        setToast({ message: `✓ Refund ${action}!`, type: 'success' })
        setReports(prev => prev.filter(r => r.orderId !== orderId))
      }
    } catch { setToast({ message: 'Failed to process refund', type: 'error' }) }
  }

  if (!user || user.role !== 'admin') return null

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">⚙️ Admin Dashboard</h1>
          
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
              <button onClick={() => setActiveTab('reports')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'reports' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>🚨 Refund Reports ({reports.length})</button>
              <button onClick={() => setActiveTab('chats')} className={`px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'chats' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>💬 Support Chats</button>
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
                    <p className="text-xs sm:text-sm text-gray-500">Total Revenue: ₦{(stats?.stats?.totalRevenue || 0).toLocaleString()}</p>
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
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-3xl">📦</div>
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
                            <button onClick={() => handleApproveSeller(s._id)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600">✓ Approve</button>
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
                            <button onClick={() => handleProcessRefund(r.orderId, 'approve-refund')} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600">✓ Approve Refund</button>
                            <button onClick={() => handleProcessRefund(r.orderId, 'reject-refund')} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600">✕ Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center py-8 text-gray-500 text-sm">No refund reports ✓</p>}
                </div>
              )}

              {activeTab === 'chats' && (
                <div>
                  <p className="text-center py-8 text-gray-500 text-sm">Support tickets and buyer-seller chats appear here. Check AI responses and escalate as needed.</p>
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
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '', storeName: '' })
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
      storeName: user.sellerProfile?.storeName || ''
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
                  <button type="submit" disabled={loading} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base">
                    {loading ? 'Updating...' : '✓ Update Profile'}
                  </button>
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
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">📋 Store name is shown to buyers on your products and store page.</p>
                  </div>
                  <button type="submit" disabled={loading} className="px-6 sm:px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base">
                    {loading ? 'Updating...' : '✓ Update Store Name'}
                  </button>
                </form>
              )}
              
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">🔐 Security Status</h4>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span>✓</span>
                      <span>Your account is secure</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">🔑 Password</h4>
                    <button className="px-4 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 text-sm">Change Password</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Footer
const Footer = () => {
  const navigate = useNavigate()
  return (
    <footer style={{ backgroundColor: colors.dark }} className="text-gray-300 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white rounded px-2 py-1"><span style={{ color: colors.primary }} className="font-bold text-sm">OM</span></div>
              <span className="font-bold text-white text-sm sm:text-base">Ospoly Market</span>
            </div>
            <p className="text-xs sm:text-sm">Your trusted campus marketplace. 100% Buyer Protection.</p>
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
            <h4 className="font-bold text-white mb-3 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>📧 support@ospolymarket.com</li>
              <li>📱 09051103883</li>
              <li>💬 Live Chat Available</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} Ospoly Market. All rights reserved. | 🛡️ 100% Secure Payments | 🔒 SSL Protected</p>
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
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/orders" element={<MyOrdersPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
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