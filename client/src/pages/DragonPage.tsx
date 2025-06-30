import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Zap, Flame, Star } from 'lucide-react';

export default function DragonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back To Homepage
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
                  DRAGON
                </h1>
                <p className="text-xl text-slate-300 mt-2">Unleash The Power Within</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dragon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Fire Dragon */}
          <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center mb-4">
              <Flame className="w-8 h-8 text-red-400 mr-3" />
              <h3 className="text-2xl font-bold text-red-400">Fire Dragon</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Master of flames and destruction, the Fire Dragon brings intense energy and power to the realm.
            </p>
            <div className="flex items-center text-sm text-red-300">
              <Star className="w-4 h-4 mr-1" />
              <span>Element: Fire</span>
            </div>
          </div>

          {/* Electric Dragon */}
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center mb-4">
              <Zap className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-bold text-blue-400">Electric Dragon</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Swift as lightning, the Electric Dragon commands the storms and brings electrifying power.
            </p>
            <div className="flex items-center text-sm text-blue-300">
              <Star className="w-4 h-4 mr-1" />
              <span>Element: Lightning</span>
            </div>
          </div>

          {/* Shadow Dragon */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 text-gray-400 mr-3" />
              <h3 className="text-2xl font-bold text-gray-400">Shadow Dragon</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Mysterious and elusive, the Shadow Dragon moves through darkness with ancient wisdom.
            </p>
            <div className="flex items-center text-sm text-gray-300">
              <Star className="w-4 h-4 mr-1" />
              <span>Element: Shadow</span>
            </div>
          </div>
        </div>

        {/* Dragon Stats */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
            Dragon Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-red-400 mb-2">3</div>
              <div className="text-slate-300">Dragon Types</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-400 mb-2">∞</div>
              <div className="text-slate-300">Power Level</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-yellow-400 mb-2">100%</div>
              <div className="text-slate-300">Legendary Status</div>
            </div>
          </div>
        </div>

        {/* Dragon Abilities */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Dragon Abilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Flame className="w-6 h-6 text-red-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-400 mb-2">Flame Breath</h4>
                <p className="text-slate-300">Unleash devastating fire attacks that can melt through any defense.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Zap className="w-6 h-6 text-blue-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-blue-400 mb-2">Lightning Strike</h4>
                <p className="text-slate-300">Call down lightning bolts with pinpoint accuracy and devastating power.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Star className="w-6 h-6 text-purple-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-purple-400 mb-2">Ancient Magic</h4>
                <p className="text-slate-300">Harness mystical energies from the dawn of time itself.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Flame className="w-6 h-6 text-orange-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-orange-400 mb-2">Dragon Roar</h4>
                <p className="text-slate-300">A mighty roar that can shatter mountains and inspire fear in enemies.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400">
          <p className="text-lg">
            "In The Heart Of Every Dragon Lies The Fire Of Creation And Destruction"
          </p>
        </div>
      </div>
    </div>
  );
}