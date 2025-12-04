import { AuthFooter } from "@/modules/auth/components";


export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="bg-gray-100 flex flex-col justify-center items-center min-h-screen">
            <div className="flex flex-1 items-center justify-center w-screen">
                {children}
            </div>
            <AuthFooter />
        </main>
    );
}
