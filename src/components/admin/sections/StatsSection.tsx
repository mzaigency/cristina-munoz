import { SecurityMonitor } from "../SecurityMonitor";

interface StatsSectionProps {
    tenantId: string;
}

const StatsSection = ({ tenantId }: StatsSectionProps) => {
    return (
        <div className="space-y-4">
            <SecurityMonitor tenantId={tenantId} />
        </div>
    );
};

export default StatsSection;
