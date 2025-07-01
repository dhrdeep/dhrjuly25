import React, { useState } from 'react';
import { MessageSquare, TrendingUp, Calendar, Music, Users, Search, Filter, ExternalLink, Clock, Heart, MessageCircle, Share2 } from 'lucide-react';
import ForumNews from '@/components/ForumNews';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const ForumPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const categories = [
    { id: 'all', name: 'All Posts', icon: MessageSquare },
    { id: 'news', name: 'Electronic News', icon: TrendingUp },
    { id: 'events', name: 'Events & Gigs', icon: Calendar },
    { id: 'releases', name: 'New Releases', icon: Music },
    { id: 'discussion', name: 'General Discussion', icon: Users }
  ];

  const forumPosts = [
    {
      id: 1,
      title: 'Afterlife announces massive 2024 world tour with Tale Of Us',
      category: 'news',
      author: 'DHR Bot',
      timestamp: '2 hours ago',
      replies: 24,
      likes: 156,
      content: 'The renowned electronic music brand Afterlife has just announced their biggest world tour yet, featuring Tale Of Us and special guests across 25 cities worldwide...',
      image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: true
    },
    {
      id: 2,
      title: 'Cercle presents: Solomun at the ancient ruins of Pompeii',
      category: 'events',
      author: 'DHR Bot',
      timestamp: '4 hours ago',
      replies: 89,
      likes: 342,
      content: 'Cercle continues to push boundaries with their latest announcement - Solomun will perform an exclusive set among the ancient ruins of Pompeii, Italy...',
      image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: false
    },
    {
      id: 3,
      title: 'New deep house gems: 10 tracks you need to hear this week',
      category: 'releases',
      author: 'DHR Bot',
      timestamp: '6 hours ago',
      replies: 45,
      likes: 198,
      content: 'Our weekly roundup of the freshest deep house releases that are making waves in the underground scene. From melodic progressions to driving basslines...',
      image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: false
    },
    {
      id: 4,
      title: 'Burning Man 2024: The deep house camps you can\'t miss',
      category: 'events',
      author: 'DHR Bot',
      timestamp: '8 hours ago',
      replies: 67,
      likes: 234,
      content: 'Black Rock City is calling! Here\'s our comprehensive guide to the best deep house camps and art cars at Burning Man 2024...',
      image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: false
    },
    {
      id: 5,
      title: 'Keinemusik collective drops surprise album "Realm"',
      category: 'releases',
      author: 'DHR Bot',
      timestamp: '12 hours ago',
      replies: 78,
      likes: 289,
      content: 'The Berlin-based collective Keinemusik has surprised fans with the unexpected release of their new album "Realm", featuring collaborations with...',
      image: 'https://images.pexels.com/photos/1677710/pexels-photo-1677710.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: false
    },
    {
      id: 6,
      title: 'What makes a perfect deep house track? Community discussion',
      category: 'discussion',
      author: 'DeepHouseLover92',
      timestamp: '1 day ago',
      replies: 156,
      likes: 423,
      content: 'I\'ve been thinking about what elements truly define a perfect deep house track. Is it the groove, the atmosphere, the vocal samples? Let\'s discuss...',
      image: null,
      isSticky: false
    },
    {
      id: 7,
      title: 'Tomorrowland 2024 lineup revealed: Deep house stages breakdown',
      category: 'events',
      author: 'DHR Bot',
      timestamp: '1 day ago',
      replies: 234,
      likes: 567,
      content: 'The wait is over! Tomorrowland has unveiled their 2024 lineup and the deep house representation is stronger than ever. Here\'s our stage-by-stage breakdown...',
      image: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=300',
      isSticky: false
    },
    {
      id: 8,
      title: 'Spotify vs SoundCloud: Where do you discover new deep house?',
      category: 'discussion',
      author: 'MusicDigger',
      timestamp: '2 days ago',
      replies: 89,
      likes: 167,
      content: 'With so many platforms available, I\'m curious about where everyone discovers their new deep house tracks. Do you prefer Spotify\'s algorithm or SoundCloud\'s underground scene?',
      image: null,
      isSticky: false
    }
  ];

  const filteredPosts = forumPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                DHR Community Forum
              </h1>
              <p className="text-gray-300 mt-1">Electronic Music News, Events & Discussions</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm max-w-2xl mx-auto">
            <p className="text-lg text-gray-200 leading-relaxed">
              Stay Connected With The Latest In Electronic Music. Our AI Moderator Curates The Best News, 
              Events, And Discussions From The Deep House Community Worldwide.
            </p>
          </div>
        </header>

        {/* Search and Filter */}
        <section className="mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forum posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                />
              </div>
              
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Live Music News & Community Updates */}
        <section className="mb-8">
          <ForumNews />
        </section>

        {/* Forum Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20 text-center">
              <div className="text-2xl font-bold text-orange-400">2.5K</div>
              <div className="text-sm text-gray-400">Active Members</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20 text-center">
              <div className="text-2xl font-bold text-orange-400">847</div>
              <div className="text-sm text-gray-400">Posts Today</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20 text-center">
              <div className="text-2xl font-bold text-orange-400">156</div>
              <div className="text-sm text-gray-400">Online Now</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-orange-400/20 text-center">
              <div className="text-2xl font-bold text-orange-400">12.8K</div>
              <div className="text-sm text-gray-400">Total Posts</div>
            </div>
          </div>
        </section>

        {/* Forum Posts */}
        <section className="mb-12">
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className={`bg-gray-800/40 backdrop-blur-xl rounded-2xl border transition-all duration-200 hover:border-orange-400/40 ${
                  post.isSticky 
                    ? 'border-orange-400/30 bg-orange-500/5' 
                    : 'border-orange-400/20 hover:bg-gray-800/60'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {post.image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-20 h-20 rounded-lg object-cover border border-orange-400/20"
                          onError={handleArtworkError}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {post.isSticky && (
                            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Pinned
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.category === 'news' ? 'bg-orange-500/20 text-orange-300' :
                            post.category === 'events' ? 'bg-amber-500/20 text-amber-300' :
                            post.category === 'releases' ? 'bg-orange-600/20 text-orange-400' :
                            'bg-gray-600/20 text-gray-300'
                          }`}>
                            {categories.find(c => c.id === post.category)?.name}
                          </span>
                        </div>
                        
                        <button className="p-2 rounded-full hover:bg-orange-500/20 transition-colors">
                          <Share2 className="h-4 w-4 text-gray-400 hover:text-orange-300" />
                        </button>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-white mb-3 hover:text-orange-300 transition-colors cursor-pointer">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimestamp(post.timestamp)}</span>
                          </div>
                          <span>by {post.author}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-orange-300 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-orange-300 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">{post.replies}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Google Ads Placeholder */}
        <section className="mb-12">
          <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-2">Advertisement</div>
            <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Google Ads Space - Forum Content</span>
            </div>
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-3xl p-8 border border-orange-400/30 backdrop-blur-sm">
            <MessageSquare className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">
              Join the Conversation
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Our AI moderator ensures quality discussions while maintaining a welcoming environment 
              for all electronic music enthusiasts. Share your thoughts, discover new music, and connect with the community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
                <MessageSquare className="h-5 w-5" />
                <span>Start Discussion</span>
              </button>
              <button className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 border border-orange-400/30">
                <ExternalLink className="h-5 w-5 text-orange-400" />
                <span>Community Guidelines</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForumPage;