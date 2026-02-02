import { supabase } from '@/lib/supabase'

export async function GET() {
    // Запросы для карточек:
    // 1. Загрузка цеха: SUM(deficit_kg) WHERE priority IN (1,2,3)
    // 2. Персонал: фиксированное значение 8 (пока)
    // 3. Критические позиции: COUNT(*) WHERE priority = 1
    // 4. Эффективность ИИ: заглушка 94.2%

    const { data, error } = await supabase.rpc('get_graviton_metrics')

    if (error) {
        // Fallsback if RPC doesn't exist yet or fails, providing mock-consistent structure
        return Response.json({
            total_deficit_kg: 292,
            staff_count: 8,
            critical_positions: 12,
            ai_efficiency: 94.2,
            last_update: new Date().toISOString()
        })
    }

    return Response.json(data)
}
