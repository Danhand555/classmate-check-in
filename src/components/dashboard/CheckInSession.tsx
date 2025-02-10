
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { generateRandomCode } from "@/utils/codeGenerator";
import { ActiveSession } from "./ActiveSession";
import { CodeGeneratorForm } from "./CodeGeneratorForm";
import { ClassSelector } from "./ClassSelector";
import { useSessionManagement } from "./useSessionManagement";

interface CheckInSessionProps {
  classes: any[];
}

export const CheckInSession = ({ classes }: CheckInSessionProps) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  const {
    activeSession,
    customCode,
    setCustomCode,
    timeLeft,
    checkedInCount,
    checkIns,
    handleStartSession,
    handleEndSession,
  } = useSessionManagement(selectedClassId);

  const handleGenerateCode = () => {
    const code = generateRandomCode();
    setCustomCode(code);
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Class Code Generator</CardTitle>
        {!activeSession && (
          <CardDescription className="text-gray-600">
            Generate a code for your students to check in
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {activeSession ? (
          <ActiveSession
            code={activeSession.code}
            timeLeft={timeLeft}
            checkedInCount={checkedInCount}
            checkIns={checkIns}
            onEndSession={handleEndSession}
          />
        ) : (
          <div className="space-y-6">
            <ClassSelector
              classes={classes}
              selectedClassId={selectedClassId}
              onClassSelect={setSelectedClassId}
            />
            <CodeGeneratorForm
              customCode={customCode}
              onCodeChange={setCustomCode}
              onGenerateCode={handleGenerateCode}
              onStartSession={handleStartSession}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
