import { Request, Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import { AuthenticatedRequest } from '../middleware/auth';

// Types for admin responses
interface AdminStats {
  totalUsers: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalJobs: number;
  totalApplications: number;
  activeUsersLast30Days: number;
  applicationsByStatus: Record<string, number>;
  jobsByStatus: Record<string, number>;
}

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  lastActivity?: Date;
  _count?: {
    applications: number;
    postedJobs: number;
  };
}

/**
 * Get comprehensive admin statistics
 */
export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      totalApplications,
      activeUsers,
      applicationsByStatus,
      jobsByStatus
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.user.count({ where: { role: 'RECRUITER' } }),
      prisma.job.count(),
      prisma.application.count(),
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: thirtyDaysAgo } },
            { applications: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { postedJobs: { some: { retrievedAt: { gte: thirtyDaysAgo } } } }
          ]
        }
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.job.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    // Format status counts
    const appStatusCounts: Record<string, number> = {};
    applicationsByStatus.forEach(item => {
      appStatusCounts[item.status] = item._count;
    });

    const jobStatusCounts: Record<string, number> = {};
    jobsByStatus.forEach(item => {
      jobStatusCounts[item.status] = item._count;
    });

    const stats: AdminStats = {
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      totalApplications,
      activeUsersLast30Days: activeUsers,
      applicationsByStatus: appStatusCounts,
      jobsByStatus: jobStatusCounts
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
}

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              applications: true,
              postedJobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers: UserListItem[] = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      _count: user._count,
      lastActivity: undefined // Could be enhanced with activity tracking
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Get user details by ID
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            applications: true,
            postedJobs: true,
            resumes: true,
            coverLetters: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
}

/**
 * Update user role
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CANDIDATE', 'RECRUITER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

/**
 * Get system activity logs
 */
export async function getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Get recent application activities
    const activities = await prisma.applicationActivity.findMany({
      include: {
        application: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                company: true
              }
            }
          }
        },
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const totalCount = await prisma.applicationActivity.count();

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check database connection
    const dbHealth = await prisma.$queryRaw`SELECT 1 as health`;

    // Get recent error rate (this is a simplified version)
    const recentActivities = await prisma.applicationActivity.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 100
    });

    const health = {
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      recentActivityCount: recentActivities.length
    };

    res.json({ health });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      health: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  }
}