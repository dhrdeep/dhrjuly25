import React, { useState } from 'react';
import { ShoppingCart, Star, Filter, Search, Heart, Plus, Minus, ExternalLink, Truck, Shield, RotateCcw, CreditCard } from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  description: string;
  sizes?: string[];
  colors?: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  featured: boolean;
  tags: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

const ShopPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const categories = [
    'all', 'clothing', 'accessories', 'vinyl', 'digital', 'bundles'
  ];

  const products: Product[] = [
    {
      id: 'dhr-tshirt-black',
      name: 'DHR Classic Logo T-Shirt',
      price: 25.99,
      originalPrice: 29.99,
      category: 'clothing',
      images: [
        'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Premium quality cotton t-shirt featuring the iconic DHR logo. Perfect for deep house lovers and festival-goers.',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White', 'Orange', 'Navy'],
      rating: 4.8,
      reviews: 127,
      inStock: true,
      featured: true,
      tags: ['bestseller', 'unisex', 'cotton']
    },
    {
      id: 'dhr-hoodie-orange',
      name: 'DHR Deep Vibes Hoodie',
      price: 49.99,
      originalPrice: 59.99,
      category: 'clothing',
      images: [
        'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Cozy premium hoodie with embroidered DHR logo and "The Deepest Beats on the Net" tagline. Perfect for those chilly festival nights.',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Orange', 'Black', 'Grey', 'Navy'],
      rating: 4.9,
      reviews: 89,
      inStock: true,
      featured: true,
      tags: ['premium', 'embroidered', 'warm']
    },
    {
      id: 'dhr-cap-snapback',
      name: 'DHR Snapback Cap',
      price: 19.99,
      category: 'accessories',
      images: [
        'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Adjustable snapback cap with 3D embroidered DHR logo. One size fits all.',
      colors: ['Black/Orange', 'All Black', 'White/Black', 'Navy/White'],
      rating: 4.7,
      reviews: 156,
      inStock: true,
      featured: false,
      tags: ['adjustable', 'embroidered', 'unisex']
    },
    {
      id: 'dhr-vinyl-compilation',
      name: 'DHR Deep House Compilation Vol. 1',
      price: 34.99,
      category: 'vinyl',
      images: [
        'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Limited edition vinyl compilation featuring the best deep house tracks from DHR. 180g heavyweight vinyl with gatefold sleeve.',
      rating: 4.9,
      reviews: 67,
      inStock: true,
      featured: true,
      tags: ['limited-edition', '180g', 'gatefold', 'compilation']
    },
    {
      id: 'dhr-tote-bag',
      name: 'DHR Eco Tote Bag',
      price: 14.99,
      category: 'accessories',
      images: [
        'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Sustainable cotton tote bag with DHR logo. Perfect for record shopping or daily use.',
      colors: ['Natural', 'Black', 'Orange'],
      rating: 4.6,
      reviews: 94,
      inStock: true,
      featured: false,
      tags: ['eco-friendly', 'cotton', 'sustainable']
    },
    {
      id: 'dhr-sticker-pack',
      name: 'DHR Sticker Pack',
      price: 7.99,
      category: 'accessories',
      images: [
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Pack of 10 waterproof vinyl stickers featuring DHR logos and deep house quotes. Perfect for laptops, phones, and gear.',
      rating: 4.8,
      reviews: 203,
      inStock: true,
      featured: false,
      tags: ['waterproof', 'vinyl', 'pack-of-10']
    },
    {
      id: 'dhr-bundle-starter',
      name: 'DHR Starter Bundle',
      price: 59.99,
      originalPrice: 79.97,
      category: 'bundles',
      images: [
        'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Perfect starter bundle including DHR t-shirt, snapback cap, and sticker pack. Save 25% compared to buying separately.',
      rating: 4.9,
      reviews: 45,
      inStock: true,
      featured: true,
      tags: ['bundle', 'save-25%', 'starter-pack']
    },
    {
      id: 'dhr-phone-case',
      name: 'DHR Phone Case',
      price: 16.99,
      category: 'accessories',
      images: [
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
      ],
      description: 'Protective phone case with DHR logo design. Available for iPhone and Samsung models.',
      colors: ['Clear/Orange', 'Black', 'White'],
      rating: 4.5,
      reviews: 78,
      inStock: true,
      featured: false,
      tags: ['protective', 'multiple-models', 'durable']
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'featured':
      default:
        return b.featured ? 1 : -1;
    }
  });

  const addToCart = (product: Product, size?: string, color?: string) => {
    const existingItem = cart.find(item => 
      item.product.id === product.id && 
      item.size === size && 
      item.color === color
    );

    if (existingItem) {
      setCart(cart.map(item => 
        item === existingItem 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, size, color }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
    } else {
      setCart(cart.map((item, i) => 
        i === index ? { ...item, quantity } : item
      ));
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 group">
      <div className="relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleArtworkError}
        />
        
        {product.originalPrice && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            SALE
          </div>
        )}
        
        {product.featured && (
          <div className="absolute top-3 right-3 bg-orange-500/20 backdrop-blur-sm rounded-full p-2">
            <Star className="h-4 w-4 text-orange-400 fill-current" />
          </div>
        )}
        
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-orange-500/20"
        >
          <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'text-orange-400 fill-current' : 'text-white'}`} />
        </button>
        
        <button
          onClick={() => setSelectedProduct(product)}
          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <span className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold">
            Quick View
          </span>
        </button>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-orange-400 fill-current' : 'text-gray-600'}`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-400">({product.reviews})</span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-orange-400">
              €{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              product.inStock
                ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-400/30 hover:scale-105'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-16 w-16 rounded-xl shadow-2xl border-2 border-orange-400/50"
                onError={handleArtworkError}
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-2">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                DHR Merchandise
              </h1>
              <p className="text-gray-300 mt-1">Official Deep House Radio Gear & Collectibles</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm max-w-2xl mx-auto">
            <p className="text-lg text-gray-200 leading-relaxed">
              Show Your Love For Deep House With Official DHR Merchandise. From Premium Apparel To 
              Limited Edition Vinyl, Find The Perfect Gear To Represent The Deepest Beats On The Net.
            </p>
          </div>
        </header>

        {/* Shopping Cart Button */}
        <div className="fixed top-20 right-4 z-40">
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-xl rounded-full p-4 border border-orange-400/30 transition-all duration-200 hover:scale-105"
          >
            <ShoppingCart className="h-6 w-6 text-orange-300" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filter */}
        <section className="mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search merchandise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                />
              </div>
              
              <div className="flex space-x-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50 appearance-none cursor-pointer"
                  >
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-gray-800">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50 appearance-none cursor-pointer"
                >
                  <option value="featured" className="bg-gray-800">Featured</option>
                  <option value="newest" className="bg-gray-800">Newest</option>
                  <option value="price-low" className="bg-gray-800">Price: Low to High</option>
                  <option value="price-high" className="bg-gray-800">Price: High to Low</option>
                  <option value="rating" className="bg-gray-800">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory === 'all' ? 'All Products' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              <span className="text-orange-400 ml-2">({filteredProducts.length})</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Shopping Cart Sidebar */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="ml-auto w-full max-w-md bg-gray-800/95 backdrop-blur-xl border-l border-orange-400/30 h-full overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Shopping Cart</h3>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item, index) => (
                        <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-orange-400/20">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={handleArtworkError}
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{item.product.name}</h4>
                              {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                              {item.color && <p className="text-xs text-gray-400">Color: {item.color}</p>}
                              <p className="text-orange-400 font-semibold">€{item.product.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-orange-400 hover:text-orange-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-orange-400/20 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-white">Total:</span>
                        <span className="text-xl font-bold text-orange-400">€{getTotalPrice().toFixed(2)}</span>
                      </div>
                      
                      <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Checkout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20">
                <Truck className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white text-sm">Free Shipping</h3>
                <p className="text-gray-400 text-xs">Orders over €50</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20">
                <Shield className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white text-sm">Secure Payment</h3>
                <p className="text-gray-400 text-xs">SSL Protected</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20">
                <RotateCcw className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white text-sm">Easy Returns</h3>
                <p className="text-gray-400 text-xs">30-day policy</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20">
                <Star className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white text-sm">Quality Guarantee</h3>
                <p className="text-gray-400 text-xs">Premium materials</p>
              </div>
            </div>
          </div>
        </section>

        {/* Google Ads Placeholder */}
        <section className="mb-12">
          <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-2">Advertisement</div>
            <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Google Ads Space - Music Equipment & Merchandise</span>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-3xl p-8 border border-orange-400/30 backdrop-blur-sm">
            <ShoppingCart className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">
              Stay Updated on New Releases
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Be the first to know about new DHR merchandise, limited edition releases, and exclusive discounts. 
              Join our newsletter for deep house fans.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
              />
              <button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShopPage;