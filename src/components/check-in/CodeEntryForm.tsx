
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

interface CodeEntryFormProps {
  onSubmit: (code: string) => Promise<void>;
  isSubmitting: boolean;
}

export const CodeEntryForm = ({ onSubmit, isSubmitting }: CodeEntryFormProps) => {
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(code);
    setCode("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="Enter 6-character code"
          className="text-center text-lg tracking-widest font-mono uppercase focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-blue-500 hover:bg-blue-600 transition-colors"
        disabled={isSubmitting || code.length !== 6}
      >
        Check In
        <ArrowRight className="ml-2" />
      </Button>
    </form>
  );
};
