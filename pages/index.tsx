import dynamic from 'next/dynamic';
// Import the component dynamically to avoid SSR issues with window
const MedicareTrainingApp = dynamic(() => import('../medicare_welcome_slides (4)'), { ssr: false });

export default function Home() {
  return <MedicareTrainingApp />;
}
