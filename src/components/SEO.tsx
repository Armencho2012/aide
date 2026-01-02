import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

const defaultSEO = {
  title: 'Aide - AI-Powered Study Assistant | Multilingual Text Analysis',
  description: 'Aide is a structured AI study engine that provides instant text analysis, key summaries, vocabulary terms, and practice quizzes in English, Russian, Armenian, and Korean. Transform any text into structured learning content.',
  keywords: 'AI study assistant, text analysis, multilingual learning, study tool, education AI, quiz generator, flashcards, Armenian, Russian, Korean',
  image: 'https://lovable.dev/opengraph-image-p98pqg.png'
};

const pageSEO: Record<string, SEOProps> = {
  '/': {
    title: 'Aide - AI-Powered Study Assistant | Transform Text into Learning Materials',
    description: 'Transform any text into comprehensive learning materials with AI-powered analysis. Get instant summaries, key terms, flashcards, and practice quizzes in multiple languages.',
    keywords: 'AI study tool, text analysis, learning materials, study assistant, multilingual education'
  },
  '/dashboard': {
    title: 'Dashboard - Aide Study Assistant',
    description: 'Analyze your text and generate comprehensive study materials including summaries, key terms, flashcards, and practice quizzes.',
    keywords: 'text analysis dashboard, study materials generator, AI analysis'
  },
  '/library': {
    title: 'Library - Your Study Materials | Aide',
    description: 'Access all your analyzed content, study materials, flashcards, and quizzes in one place.',
    keywords: 'study library, content archive, learning materials'
  },
  '/billing': {
    title: 'Upgrade to Pro - Aide Study Assistant',
    description: 'Upgrade to Aide Pro for unlimited text analyses and advanced features.',
    keywords: 'upgrade, pro plan, unlimited analysis'
  },
  '/settings': {
    title: 'Settings - Aide Study Assistant',
    description: 'Manage your account settings, language preferences, and theme.',
    keywords: 'account settings, preferences'
  }
};

export const SEO = ({ title, description, keywords, image }: SEOProps) => {
  const location = useLocation();
  const pageData = pageSEO[location.pathname] || {};
  
  const finalTitle = title || pageData.title || defaultSEO.title;
  const finalDescription = description || pageData.description || defaultSEO.description;
  const finalKeywords = keywords || pageData.keywords || defaultSEO.keywords;
  const finalImage = image || pageData.image || defaultSEO.image;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    
    // Open Graph tags
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:image', finalImage, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', window.location.href, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalImage);
  }, [finalTitle, finalDescription, finalKeywords, finalImage, location.pathname]);

  return null;
};

