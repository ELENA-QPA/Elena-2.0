/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: "https",
            hostname: "zonapet-files.s3.us-east-2.amazonaws.com",
        }, ],
    },

};

export default nextConfig;