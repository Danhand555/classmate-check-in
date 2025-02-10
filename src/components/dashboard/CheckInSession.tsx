
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  if (classes.length === 0) {
    return (
      <Card className="col-span-full animate-fadeIn">
        <CardHeader>
          <CardTitle>Class Code Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No classes available. Please create a class first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Class Code Generator</CardTitle>
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
