import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col justify-between gap-12 bg-white px-16 py-24 dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col gap-6 text-left">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            Local Cognito token を Go gRPC の認証まで通す確認用の admin 画面
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            `web/admin-cognito` で取得した access token を `web/admin/hello` に貼り付けると、
            Next.js Route Handler 経由で Go gRPC の JWT 検証まで確認できます。
          </p>
        </div>
        <div className="grid w-full gap-4 text-base font-medium sm:grid-cols-2">
          <Link
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-black px-5 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href="/hello"
          >
            Open Hello Auth Check
          </Link>
          <div className="rounded-2xl border border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <div className="mb-2 font-semibold text-zinc-950 dark:text-zinc-50">Flow</div>
            <p>
              `admin-cognito` で login → access token をコピー → `hello` 画面で貼り付け →
              未認証と認証ありを比較
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
