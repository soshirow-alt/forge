// Preview/local only; VERCEL_ENV=production hard-stop; Production keeps legacy UI.
export {
  shouldServeFutureDiscoveryHome as shouldServePlayerIaRedesign,
} from "@/lib/production-mode";
