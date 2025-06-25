import React, { useState } from 'react';
import { Upload, Download, FileText, Cloud, Server, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function JumpshareSetupPage() {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const storageOptions = [
    {
      id: 'jumpshare-api',
      title: 'Jumpshare API Integration',
      icon: Cloud,
      cost: '$19/month',
      pros: [
        'Automated bulk upload via API',
        'Generate all URLs programmatically',
        '1TB storage included',
        'Built-in streaming and download links',
        'CDN delivery worldwide'
      ],
      cons: [
        'Monthly subscription cost',
        'API rate limits',
        'Vendor lock-in'
      ],
      implementation: 'Use Jumpshare Pro API to bulk upload and auto-generate URLs',
      complexity: 'Medium',
      timeToSetup: '2-3 hours'
    },
    {
      id: 'aws-s3',
      title: 'AWS S3 + CloudFront CDN',
      icon: Server,
      cost: '$50-100/month',
      pros: [
        'Full control over files',
        'Unlimited scalability',
        'Global CDN distribution',
        'Advanced access controls',
        'Direct streaming support',
        'Backup and versioning'
      ],
      cons: [
        'More complex setup',
        'Higher cost for 1TB',
        'Technical configuration required'
      ],
      implementation: 'Upload to S3, use CloudFront for CDN, generate signed URLs for access control',
      complexity: 'High',
      timeToSetup: '4-6 hours'
    },
    {
      id: 'direct-server',
      title: 'Direct Server Hosting',
      icon: Server,
      cost: '$20-40/month',
      pros: [
        'Complete control',
        'No third-party dependencies',
        'Custom access controls',
        'Lowest ongoing cost'
      ],
      cons: [
        'Server management required',
        'Bandwidth costs',
        'No global CDN',
        'Backup responsibility'
      ],
      implementation: 'Host on dedicated server with nginx, implement streaming endpoints',
      complexity: 'High',
      timeToSetup: '6-8 hours'
    },
    {
      id: 'hybrid',
      title: 'Hybrid: Jumpshare + CSV Import',
      icon: Zap,
      cost: '$19/month',
      pros: [
        'Best of both worlds',
        'Bulk upload to Jumpshare manually',
        'CSV import for metadata',
        'Quick implementation',
        'Reliable CDN delivery'
      ],
      cons: [
        'Manual upload process',
        'URL management needed'
      ],
      implementation: 'Upload files to Jumpshare, export URLs to CSV, bulk import via our system',
      complexity: 'Low',
      timeToSetup: '1-2 hours'
    }
  ];

  const implementationSteps = {
    'jumpshare-api': [
      '1. Subscribe to Jumpshare Pro ($19/month)',
      '2. Get API credentials from Jumpshare dashboard',
      '3. Install Jumpshare API integration in our system',
      '4. Bulk upload your 1000+ files via API',
      '5. Auto-generate download and stream URLs',
      '6. Import metadata into database'
    ],
    'aws-s3': [
      '1. Create AWS account and S3 bucket',
      '2. Configure CloudFront CDN distribution',
      '3. Set up IAM roles for secure access',
      '4. Upload files to S3 (can be automated)',
      '5. Generate signed URLs for access control',
      '6. Import file URLs and metadata'
    ],
    'direct-server': [
      '1. Set up dedicated server (VPS/dedicated)',
      '2. Configure nginx for file serving',
      '3. Implement streaming endpoints',
      '4. Upload your mix files',
      '5. Create access control system',
      '6. Import metadata and file paths'
    ],
    'hybrid': [
      '1. Subscribe to Jumpshare Pro',
      '2. Manually upload your 1000+ files',
      '3. Export all Jumpshare URLs to CSV',
      '4. Use our bulk import tool to load everything',
      '5. Search and access system ready immediately'
    ]
  };

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-4">
            1000+ Mix Collection Setup
          </h1>
          <p className="text-xl text-gray-300">Choose The Best Storage Solution For Your Deep House Library</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {storageOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;
            
            return (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`cursor-pointer bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border transition-all ${
                  isSelected 
                    ? 'border-orange-400/50 bg-orange-500/10' 
                    : 'border-gray-600/30 hover:border-orange-400/30'
                }`}
              >
                <div className="flex items-center mb-4">
                  <Icon className="h-8 w-8 text-orange-400 mr-3" />
                  <div>
                    <h3 className="text-xl font-black text-white">{option.title}</h3>
                    <p className="text-orange-300 font-semibold">{option.cost}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-green-300 font-bold mb-2">Pros:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {option.pros.map((pro, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-red-300 font-bold mb-2">Cons:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {option.cons.map((con, index) => (
                        <li key={index} className="flex items-start">
                          <AlertCircle className="h-3 w-3 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Complexity:</span>
                    <span className={`ml-2 font-semibold ${
                      option.complexity === 'Low' ? 'text-green-300' :
                      option.complexity === 'Medium' ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {option.complexity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Setup Time:</span>
                    <span className="ml-2 text-orange-300 font-semibold">{option.timeToSetup}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedOption && (
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/20">
            <h2 className="text-3xl font-black text-orange-300 mb-6">
              Implementation Plan: {storageOptions.find(opt => opt.id === selectedOption)?.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Step-by-Step Implementation:</h3>
                <ol className="space-y-3">
                  {implementationSteps[selectedOption as keyof typeof implementationSteps]?.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-300 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-4">What You'll Get:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Fully searchable 1000+ mix library
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Tiered access control (view/play/download)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Daily download limits for VIP members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Genre and tag filtering
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Streaming and download capabilities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Admin panel for content management
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="bg-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-blue-300 mb-4">My Recommendation</h3>
            <p className="text-gray-300 mb-4">
              For 1000+ mixes, I recommend the <strong>Hybrid Approach</strong> for fastest setup, 
              or <strong>AWS S3</strong> for maximum control and scalability.
            </p>
            <p className="text-blue-200">
              The bulk import system is already built and ready - you just need to choose your storage solution 
              and prepare the CSV file with your mix metadata and URLs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}