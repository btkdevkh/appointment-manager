import {LogOut} from "lucide-react";
import {signOut} from "@/lib/auth";

type Props = {
  name?: string | null;
  image?: string | null;
};

// Rendered into the manager's header once signed in.
const UserMenu = ({name, image}: Props) => {
  return (
    <div className="flex items-center gap-2.5">
      {image && (
        // Google's avatar host isn't configured for next/image, and this is a
        // fixed 28px thumbnail, so a plain <img> is the honest choice here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          width={28}
          height={28}
          className="rounded-full"
        />
      )}
      {name && (
        <span className="hidden text-sm text-neutral-600 sm:inline">{name}</span>
      )}
      <form
        action={async () => {
          "use server";
          await signOut({redirectTo: "/"});
        }}
      >
        <button
          type="submit"
          title="Se déconnecter"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Se déconnecter</span>
        </button>
      </form>
    </div>
  );
};

export default UserMenu;
