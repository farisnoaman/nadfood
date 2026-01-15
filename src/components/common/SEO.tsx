import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    companyName?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image,
    url,
    companyName
}) => {
    const siteTitle = companyName || 'نظام تتبع الشحنات';
    const finalTitle = title ? `${title} | ${siteTitle}` : `نظام تتبع الشحنات - ${siteTitle}`;
    const siteDescription = description || 'منصة متكاملة لإدارة عمليات النقل، تتبع الشحنات، إدارة السائقين، واللوجستيات.';
    const siteKeywords = keywords || 'نقل, شحنات, تتبع, لوجستيات, سائقين, إدارة أسطول';
    const siteImage = image || '/icon-512.png';
    const siteUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Basic */}
            <title>{finalTitle}</title>
            <meta name="description" content={siteDescription} />
            <meta name="keywords" content={siteKeywords} />
            <meta name="theme-color" content="#3b82f6" />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={siteImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={siteUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={siteDescription} />
            <meta property="twitter:image" content={siteImage} />
        </Helmet>
    );
};

export default SEO;
