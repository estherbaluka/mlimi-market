import HeartIcon from "@/components/ui/heart";

export async function Footer() {
return (
<footer className=" border-t border-zinc-200 bg-white py-6">
            <div className="mx-auto max-w-6xl px-4 text-center text-sm text-zinc-600">
              © {new Date().getFullYear()} Mlimi Market. By Baluka Esther — with <HeartIcon className="mx-1 align-middle" />. All terms reserved.
            </div>
          </footer>
          )
          }
