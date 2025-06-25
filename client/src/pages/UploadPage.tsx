import React, { useState } from 'react';
import { Upload, Music, Send, CheckCircle, AlertCircle, ExternalLink, FileAudio, Clock, Users, Star, Mail } from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const UploadPage: React.FC = () => {
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    mixTitle: '',
    genre: 'deep-house',
    duration: '',
    description: '',
    wetransferLink: '',
    socialMedia: '',
    previousReleases: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create email content
    const emailSubject = `DHR Mix Submission: ${formData.mixTitle} by ${formData.artistName}`;
    const emailBody = `
New mix submission for DHR:

Artist/DJ Name: ${formData.artistName}
Email: ${formData.email}
Mix Title: ${formData.mixTitle}
Genre: ${formData.genre}
Duration: ${formData.duration}
WeTransfer Link: ${formData.wetransferLink}

Description:
${formData.description}

Social Media:
${formData.socialMedia}

Previous Releases/Experience:
${formData.previousReleases}

---
Submitted via DHR Website
    `.trim();

    // Create mailto link
    const mailtoLink = `mailto:deephouseradio@outlook.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Simulate form submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Reset form after successful submission
      setFormData({
        artistName: '',
        email: '',
        mixTitle: '',
        genre: 'deep-house',
        duration: '',
        description: '',
        wetransferLink: '',
        socialMedia: '',
        previousReleases: ''
      });
    }, 2000);
  };

  const submissionStats = [
    { icon: FileAudio, label: 'Submissions This Month', value: '247' },
    { icon: CheckCircle, label: 'Tracks Featured', value: '89' },
    { icon: Clock, label: 'Average Review Time', value: '5-7 days' },
    { icon: Users, label: 'Active DJs', value: '1.2K+' }
  ];

  const guidelines = [
    {
      title: 'Audio Quality',
      description: 'Submit high-quality audio files (320kbps MP3 minimum or WAV preferred)',
      icon: FileAudio
    },
    {
      title: 'Genre Focus',
      description: 'We specialize in deep house, tech house, progressive, and melodic house',
      icon: Music
    },
    {
      title: 'Original Content',
      description: 'Only submit original mixes or tracks you have rights to distribute',
      icon: Star
    },
    {
      title: 'Professional Presentation',
      description: 'Include proper track information, artwork, and professional description',
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
                <Upload className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                DJ Submissions
              </h1>
              <p className="text-gray-300 mt-1">Share Your Deep House Mixes With Our Global Audience</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm max-w-2xl mx-auto">
            <p className="text-lg text-gray-200 leading-relaxed">
              Are You A DJ Or Producer With Amazing Deep House Content? We're Always Looking For Fresh Talent 
              To Feature On DHR. Submit Your Mixes For Consideration And Reach Thousands Of Deep House Enthusiasts Worldwide.
            </p>
          </div>
        </header>

        {/* Contact Info */}
        <section className="mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Mail className="h-5 w-5 text-orange-400" />
              <span className="text-orange-300 font-semibold">Direct Contact</span>
            </div>
            <p className="text-gray-300">
              For direct submissions or inquiries: 
              <a 
                href="mailto:deephouseradio@outlook.com" 
                className="text-orange-400 hover:text-orange-300 ml-2 font-medium"
              >
                deephouseradio@outlook.com
              </a>
            </p>
          </div>
        </section>

        {/* Submission Stats */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {submissionStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 group">
                    <Icon className="h-8 w-8 text-orange-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submission Form */}
        <section className="mb-12">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Send className="h-6 w-6 text-orange-400" />
              <span>Submit Your Mix</span>
            </h2>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-orange-400" />
                <span className="text-orange-200">
                  Your email client should open with the submission details. If not, please copy the information and send it manually to deephouseradio@outlook.com
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="artistName" className="block text-sm font-medium text-orange-200 mb-2">
                    Artist/DJ Name *
                  </label>
                  <input
                    type="text"
                    id="artistName"
                    name="artistName"
                    value={formData.artistName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                    placeholder="Your stage name or real name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-orange-200 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mixTitle" className="block text-sm font-medium text-orange-200 mb-2">
                    Mix Title *
                  </label>
                  <input
                    type="text"
                    id="mixTitle"
                    name="mixTitle"
                    value={formData.mixTitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                    placeholder="Deep House Sessions Vol. 1"
                  />
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-orange-200 mb-2">
                    Primary Genre *
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  >
                    <option value="deep-house">Deep House</option>
                    <option value="tech-house">Tech House</option>
                    <option value="progressive-house">Progressive House</option>
                    <option value="melodic-house">Melodic House</option>
                    <option value="organic-house">Organic House</option>
                    <option value="minimal-house">Minimal House</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-orange-200 mb-2">
                  Mix Duration
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  placeholder="e.g., 1h 30m"
                />
              </div>

              <div>
                <label htmlFor="wetransferLink" className="block text-sm font-medium text-orange-200 mb-2">
                  WeTransfer Download Link *
                </label>
                <input
                  type="url"
                  id="wetransferLink"
                  name="wetransferLink"
                  value={formData.wetransferLink}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  placeholder="https://wetransfer.com/downloads/..."
                />
                <p className="text-sm text-gray-400 mt-2">
                  Upload your mix to WeTransfer and paste the download link here. Files should be high quality (320kbps MP3 or WAV).
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-orange-200 mb-2">
                  Mix Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  placeholder="Describe your mix, the vibe, key tracks, or any special story behind it..."
                />
              </div>

              <div>
                <label htmlFor="socialMedia" className="block text-sm font-medium text-orange-200 mb-2">
                  Social Media Links
                </label>
                <input
                  type="text"
                  id="socialMedia"
                  name="socialMedia"
                  value={formData.socialMedia}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  placeholder="Instagram, SoundCloud, Spotify, etc."
                />
              </div>

              <div>
                <label htmlFor="previousReleases" className="block text-sm font-medium text-orange-200 mb-2">
                  Previous Releases/Experience
                </label>
                <textarea
                  id="previousReleases"
                  name="previousReleases"
                  value={formData.previousReleases}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  placeholder="Tell us about your previous releases, gigs, or experience in the scene..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-lg font-semibold text-lg shadow-lg transform transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Preparing Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Mix for Review</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Submission Guidelines */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Submission Guidelines
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {guidelines.map((guideline, index) => {
              const Icon = guideline.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{guideline.title}</h3>
                      <p className="text-gray-400 text-sm">{guideline.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Google Ads Placeholder */}
        <section className="mb-12">
          <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-2">Advertisement</div>
            <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Google Ads Space - DJ Services & Equipment</span>
            </div>
          </div>
        </section>

        {/* WeTransfer Info */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-3xl p-8 border border-orange-400/30 backdrop-blur-sm">
            <Upload className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">
              How to Use WeTransfer
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              WeTransfer is our preferred method for receiving large audio files. It's free, secure, and easy to use. 
              Simply upload your mix, get the download link, and paste it in the form above.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="https://wetransfer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <ExternalLink className="h-5 w-5" />
                <span>Go to WeTransfer</span>
              </a>
              <button className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 border border-orange-400/30">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <span>Upload Tutorial</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UploadPage;