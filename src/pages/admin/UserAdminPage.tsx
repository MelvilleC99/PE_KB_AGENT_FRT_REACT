import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw, Shield, User as UserIcon } from "lucide-react"
import { getUsers, createUser, updateUser, deleteUser, type User, type CreateUserInput, type UpdateUserInput } from "@/lib/api/admin"

export function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '', 
    password: '', 
    name: '', 
    surname: '', 
    company: 'Betterhome',
    office: 'PropTech Division', 
    role: 'user', 
    phone: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Direct Firebase read (fast!)
      const users = await getUsers()
      setUsers(users)
    } catch (error) {
      console.error("Failed to load users:", error)
      toast({ 
        title: "Error Loading Users", 
        description: "Failed to fetch users from database", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    loadUsers() 
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
    toast({ 
      title: "Password Generated", 
      description: "Random password generated" 
    })
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await createUser(formData)
      if (response.success) {
        toast({ 
          title: "User Created", 
          description: `${formData.name} ${formData.surname} added` 
        })
        setShowAddModal(false)
        setFormData({ 
          email: '', 
          password: '', 
          name: '', 
          surname: '', 
          company: 'Betterhome', 
          office: 'PropTech Division', 
          role: 'user', 
          phone: '' 
        })
        loadUsers()
      } else {
        toast({ 
          title: "Error Creating User", 
          description: response.error, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create user", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const updates: UpdateUserInput = {
        name: formData.name,
        surname: formData.surname,
        company: formData.company,
        office: formData.office,
        role: formData.role,
        phone: formData.phone
      }
      const response = await updateUser(selectedUser.email, updates)
      if (response.success) {
        toast({ 
          title: "User Updated", 
          description: `${formData.name} ${formData.surname} updated` 
        })
        setShowEditModal(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast({ 
          title: "Error Updating User", 
          description: response.error, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update user", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const response = await deleteUser(selectedUser.email)
      if (response.success) {
        toast({ 
          title: "User Deleted", 
          description: `${selectedUser.full_name} removed` 
        })
        setShowDeleteDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast({ 
          title: "Error Deleting User", 
          description: response.error, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete user", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({ 
      email: user.email, 
      password: '', 
      name: user.name, 
      surname: user.surname, 
      company: user.company, 
      office: user.office, 
      role: user.role, 
      phone: user.phone || '' 
    })
    setShowEditModal(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Regular Users</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--pe-action)] flex items-center justify-center text-white text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>{user.office}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-600 font-medium">Admin</span>
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-600">User</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openDeleteDialog(user)} 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input 
                type="email"
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <Label>Surname *</Label>
                <Input 
                  required 
                  value={formData.surname} 
                  onChange={(e) => setFormData({...formData, surname: e.target.value})} 
                />
              </div>
            </div>
            <div>
              <Label>Password *</Label>
              <div className="flex space-x-2">
                <Input 
                  required 
                  type="text" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generatePassword}
                  title="Generate random password"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company *</Label>
                <Input 
                  required 
                  value={formData.company} 
                  onChange={(e) => setFormData({...formData, company: e.target.value})} 
                />
              </div>
              <div>
                <Label>Office</Label>
                <Input 
                  value={formData.office} 
                  onChange={(e) => setFormData({...formData, office: e.target.value})} 
                />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={formData.email} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <Label>Surname *</Label>
                <Input 
                  required 
                  value={formData.surname} 
                  onChange={(e) => setFormData({...formData, surname: e.target.value})} 
                />
              </div>
            </div>
            <div>
              <Label>Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-red-600 hover:bg-red-700" 
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
