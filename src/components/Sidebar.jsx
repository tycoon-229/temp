"use client"; // Bắt buộc vì dùng hooks (usePathname)

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Home, Search, Library } from "lucide-react"; // Icon
import Link from "next/link";

const Sidebar = ({ children }) => {
  const pathname = usePathname();

  // Định nghĩa các đường dẫn menu
  const routes = useMemo(() => [
    {
      icon: Home,
      label: 'Trang chủ',
      active: pathname !== '/search',
      href: '/',
    },
    {
      icon: Search,
      label: 'Tìm kiếm',
      active: pathname === '/search',
      href: '/search',
    }
  ], [pathname]);

  return (
    <div className="flex h-full">
      {/* Cột Sidebar bên trái */}
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        
        {/* Box Menu trên: Home & Search */}
        <div className="bg-neutral-900 rounded-lg h-fit w-full p-4 flex flex-col gap-y-4">
          {routes.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-row h-auto items-center w-full gap-x-4 text-md font-medium cursor-pointer hover:text-white transition ${item.active ? "text-white" : "text-neutral-400"}`}
            >
              <item.icon size={26} />
              <p className="truncate w-100">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Box Menu dưới: Library (Thư viện) */}
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-y-auto p-4">
           <div className="flex items-center gap-x-2 text-neutral-400 mb-4">
             <Library size={26} />
             <p className="font-medium text-md">Thư viện của tôi</p>
           </div>
           {/* Sau này sẽ list playlist ở đây */}
           <p className="text-neutral-500 text-sm">Danh sách Playlist...</p>
        </div>

      </div>

      {/* Phần nội dung chính (Main Content) bên phải */}
      <main className="h-full flex-1 overflow-y-auto py-2 pr-2 pb-[100px]">
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
}

export default Sidebar;