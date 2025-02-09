
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer } from "lucide-react";

interface CodeGeneratorFormProps {
  customCode: string;
  onCodeChange: (code: string) => void;
  onGenerateCode: () => void;
  onStartSession: () => void;
}

export const CodeGeneratorForm = ({
  customCode,
  onCodeChange,
  onGenerateCode,
  onStartSession,
}: CodeGeneratorFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={customCode}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            if (value.length <= 6 && /^[A-Z0-9]*$/.test(value)) {
              onCodeChange(value);
            }
          }}
          placeholder="Enter custom code"
          maxLength={6}
          className="text-lg"
        />
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onStartSession}
        >
          Use Code
        </Button>
      </div>
      <Button
        className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
        onClick={onGenerateCode}
      >
        <Timer className="w-6 h-6 mr-2" />
        Generate Random Code
      </Button>
    </div>
  );
};
