import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsChartsProps {
  usersByRole: { role: string; count: number }[];
  tasksByStatus: { status: string; count: number }[];
}

const COLORS = {
  roles: ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"],
  tasks: [
    "hsl(var(--muted-foreground))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--success))",
  ],
};

export function AnalyticsCharts({ usersByRole, tasksByStatus }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Users by Role Pie Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Users by Role</h3>
        {usersByRole.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No user data available
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="role"
                  label={({ role, count }) => `${role}: ${count}`}
                  labelLine={false}
                >
                  {usersByRole.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.roles[index % COLORS.roles.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-center gap-4 mt-4">
          {usersByRole.map((item, index) => (
            <div key={item.role} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.roles[index % COLORS.roles.length] }}
              />
              <span className="text-muted-foreground">{item.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks by Status Bar Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Tasks by Status</h3>
        {tasksByStatus.every((t) => t.count === 0) ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No task data available
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="status"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {tasksByStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.tasks[index % COLORS.tasks.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
