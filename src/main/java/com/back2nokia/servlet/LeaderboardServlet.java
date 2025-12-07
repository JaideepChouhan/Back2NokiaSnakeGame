package com.back2nokia.servlet;

import com.back2nokia.util.DBUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Aggregated leaderboard: per-user totals (SUM of scores) with optional subject filter.
 * Returns top-20 users by total_score.
 *
 * Query params:
 *   - subject (optional): when present, totals are calculated only for that subject.
 *
 * Output JSON:
 * [
 *   {"username":"saloni","total_score":215,"last_played":"2025-12-07 08:15:18.0"},
 *   ...
 * ]
 */
@WebServlet("/leaderboard")
public class LeaderboardServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String subject = req.getParameter("subject");
        boolean hasSubject = (subject != null && !subject.trim().isEmpty());

        // Aggregate per user (group by user id) — this preserves distinct accounts even if usernames duplicate.
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT u.username, COALESCE(SUM(s.score),0) AS total_score, MAX(s.created_at) AS last_played ");
        sql.append("FROM users u JOIN scores s ON u.id = s.user_id");

        if (hasSubject) {
            sql.append(" WHERE s.subject = ?");
        }

        sql.append(" GROUP BY u.id, u.username");
        sql.append(" ORDER BY total_score DESC, last_played DESC");
        sql.append(" LIMIT 20");

        resp.setContentType("application/json");
        StringBuilder out = new StringBuilder();
        out.append("[");

        try (Connection conn = DBUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            if (hasSubject) ps.setString(1, subject);

            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) out.append(",");
                    String usernameVal = rs.getString("username");
                    int total = rs.getInt("total_score");
                    java.sql.Timestamp ts = rs.getTimestamp("last_played");
                    String lastPlayed = ts == null ? "" : ts.toString();

                    // minimal JSON escaping for username
                    String safeName = usernameVal == null ? "" : usernameVal.replace("\\", "\\\\").replace("\"", "\\\"");

                    out.append("{")
                       .append("\"username\":\"").append(safeName).append("\",")
                       .append("\"total_score\":").append(total).append(",")
                       .append("\"last_played\":\"").append(lastPlayed).append("\"")
                       .append("}");
                    first = false;
                }
            }

            out.append("]");
            resp.getWriter().write(out.toString());
        } catch (Exception ex) {
            ex.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("[]");
        }
    }
}