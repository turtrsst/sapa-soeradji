import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CampaignTicker from '@/components/CampaignTicker';
import MiniAssistant from '@/components/MiniAssistant';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CampaignTicker />
      <main className="flex-1">{children}</main>
      <Footer />
      <MiniAssistant />
    </>
  );
}
