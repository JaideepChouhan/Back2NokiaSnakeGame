package com.back2nokia.servlet;

import com.back2nokia.util.DBUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;

/**
 * SaveScoreServlet - saves/updates best score per user+subject.
 * Ensures session flag is set after any save/ignore so same run cannot save multiple times.
 */
@WebServlet("/save-score")
public class SaveScoreServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);

        try (PrintWriter out = resp.getWriter()) {
            if (session == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"status\":\"error\",\"message\":\"Not logged in\"}");
                return;
            }

            Integer userId = (Integer) session.getAttribute("userId");
            if (userId == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"status\":\"error\",\"message\":\"Not logged in\"}");
                return;
            }

            String scoreStr = req.getParameter("score");
            String subject = req.getParameter("subject");
            if (subject == null || subject.trim().isEmpty()) subject = "general";

            int incomingScore = 0;
            try { incomingScore = Integer.parseInt(scoreStr); }
            catch (Exception e) { incomingScore = 0; }

            final String sessionFlag = "saved_" + subject;

            Connection conn = null;
            PreparedStatement ps = null;
            ResultSet rs = null;
            try {
                conn = DBUtil.getConnection();
                conn.setAutoCommit(false);

                ps = conn.prepareStatement("SELECT id, score FROM scores WHERE user_id = ? AND subject = ?");
                ps.setInt(1, userId);
                ps.setString(2, subject);
                rs = ps.executeQuery();

                if (rs.next()) {
                    int id = rs.getInt("id");
                    int existing = rs.getInt("score");
                    rs.close();
                    ps.close();

                    if (incomingScore > existing) {
                        ps = conn.prepareStatement("UPDATE scores SET score = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
                        ps.setInt(1, incomingScore);
                        ps.setInt(2, id);
                        ps.executeUpdate();
                        conn.commit();

                        session.setAttribute(sessionFlag, true);
                        out.print("{\"status\":\"updated\",\"message\":\"Score updated\",\"score\":" + incomingScore + "}");
                    } else {
                        conn.commit();

                        // IMPORTANT: still set session flag so same run cannot save again
                        session.setAttribute(sessionFlag, true);
                        out.print("{\"status\":\"ignored\",\"message\":\"Score not higher than existing\",\"score\":" + existing + "}");
                    }
                } else {
                    if (rs != null) { rs.close(); }
                    if (ps != null) { ps.close(); }
                    try {
                        ps = conn.prepareStatement("INSERT INTO scores (user_id, subject, score) VALUES (?, ?, ?)");
                        ps.setInt(1, userId);
                        ps.setString(2, subject);
                        ps.setInt(3, incomingScore);
                        ps.executeUpdate();
                        conn.commit();

                        session.setAttribute(sessionFlag, true);
                        out.print("{\"status\":\"saved\",\"message\":\"Score saved\",\"score\":" + incomingScore + "}");
                    } catch (SQLException insertEx) {
                        // rare race: recover by re-reading row
                        try {
                            if (ps != null) ps.close();
                            ps = conn.prepareStatement("SELECT id, score FROM scores WHERE user_id = ? AND subject = ?");
                            ps.setInt(1, userId);
                            ps.setString(2, subject);
                            rs = ps.executeQuery();
                            if (rs.next()) {
                                int id = rs.getInt("id");
                                int existing = rs.getInt("score");
                                if (incomingScore > existing) {
                                    rs.close(); ps.close();
                                    ps = conn.prepareStatement("UPDATE scores SET score = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
                                    ps.setInt(1, incomingScore);
                                    ps.setInt(2, id);
                                    ps.executeUpdate();
                                    conn.commit();
                                    session.setAttribute(sessionFlag, true);
                                    out.print("{\"status\":\"updated\",\"message\":\"Score updated\",\"score\":" + incomingScore + "}");
                                } else {
                                    conn.commit();
                                    session.setAttribute(sessionFlag, true);
                                    out.print("{\"status\":\"ignored\",\"message\":\"Score not higher than existing\",\"score\":" + existing + "}");
                                }
                            } else {
                                conn.rollback();
                                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                                out.print("{\"status\":\"error\",\"message\":\"Could not save score\"}");
                            }
                        } catch (Exception rec) {
                            try { if (conn != null) conn.rollback(); } catch (Exception ignore) {}
                            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                            out.print("{\"status\":\"error\",\"message\":\"Server error\"}");
                        }
                    }
                }
            } catch (Exception ex) {
                try { if (conn != null) conn.rollback(); } catch (Exception ignore) {}
                ex.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Server error\"}");
            } finally {
                try { if (rs != null) rs.close(); } catch (Exception ignore) {}
                try { if (ps != null) ps.close(); } catch (Exception ignore) {}
                try { if (conn != null) conn.close(); } catch (Exception ignore) {}
            }
        }
    }
}