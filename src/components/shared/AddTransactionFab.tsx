import Button from "@/components/ui/Button";

export default function AddTransactionFab() {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10">
      <Button
        variant="primary"
        className="shadow-xl shadow-[#6e59f5]/40"
        icon={<span className="text-lg leading-none">＋</span>}
        onClick={() => console.log("Tambah transaksi")}
      >
        Catat Transaksi
      </Button>
    </div>
  );
}
