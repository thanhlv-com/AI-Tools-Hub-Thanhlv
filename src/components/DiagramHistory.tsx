import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  History,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

import { DiagramHistoryItem, DIAGRAM_TYPES } from '@/types/diagram';

interface ExtendedDiagramHistoryItem extends Omit<DiagramHistoryItem, 'pumlCode'> {
  pumlCode?: string;
  diagramCode?: string;
  explanation?: string;
  outputFormat?: string;
}

interface DiagramHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadHistory: (item: ExtendedDiagramHistoryItem) => void;
}

export function DiagramHistory({ isOpen, onClose, onLoadHistory }: DiagramHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExtendedDiagramHistoryItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load history from localStorage
  const historyItems = useMemo(() => {
    try {
      const history = localStorage.getItem('ddl-tool-diagram-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading diagram history:', error);
      return [];
    }
  }, []);

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return historyItems;
    
    const term = searchTerm.toLowerCase();
    return historyItems.filter((item: any) => 
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      (item.pumlCode && item.pumlCode.toLowerCase().includes(term)) ||
      (item.diagramCode && item.diagramCode.toLowerCase().includes(term)) ||
      (item.explanation && item.explanation.toLowerCase().includes(term))
    );
  }, [historyItems, searchTerm]);

  const handleLoadHistory = (item: ExtendedDiagramHistoryItem) => {
    onLoadHistory(item);
    onClose();
  };

  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const updatedHistory = historyItems.filter((item: DiagramHistoryItem) => item.id !== itemId);
      localStorage.setItem('ddl-tool-diagram-history', JSON.stringify(updatedHistory));
      toast.success('Đã xóa item khỏi lịch sử');
      
      // Force re-render by closing and reopening if needed
      if (selectedItem && selectedItem.id === itemId) {
        setSelectedItem(null);
        setShowPreview(false);
      }
    } catch (error) {
      toast.error('Lỗi khi xóa item');
    }
  };

  const handleExportHistory = () => {
    try {
      const dataStr = JSON.stringify(historyItems, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagram-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Đã xuất lịch sử thành công');
    } catch (error) {
      toast.error('Lỗi khi xuất lịch sử');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}`);
    } catch (error) {
      toast.error('Lỗi sao chép');
    }
  };

  const getDiagramTypeName = (diagramType: string) => {
    const type = DIAGRAM_TYPES.find(t => t.id === diagramType);
    return type ? `${type.icon} ${type.name}` : diagramType;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch sử sơ đồ
              <Badge variant="secondary">{historyItems.length} items</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm trong lịch sử..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleExportHistory}>
                <Download className="w-4 h-4 mr-1" />
                Xuất
              </Button>
            </div>

            {/* History List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử sơ đồ'}
                </div>
              ) : (
                filteredHistory.map((item: DiagramHistoryItem) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                    onClick={() => handleLoadHistory(item)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {item.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getDiagramTypeName(item.diagramType)}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setShowPreview(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Model: {item.model}</span>
                        <span>{(item.pumlCode || item.diagramCode || '').length} ký tự</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Xem trước sơ đồ
              {selectedItem && (
                <Badge variant="outline">
                  {getDiagramTypeName(selectedItem.diagramType)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 overflow-y-auto">
              <div>
                <h3 className="font-medium mb-1">{selectedItem.title}</h3>
                <p className="text-sm text-gray-600">{selectedItem.description}</p>
              </div>

              {selectedItem.explanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-1">Giải thích:</h4>
                  <p className="text-blue-700 text-sm">{selectedItem.explanation}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Code {selectedItem.outputFormat === 'plantuml' ? 'PlantUML' : 'Diagram'}:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      selectedItem.pumlCode || selectedItem.diagramCode || '', 
                      `${selectedItem.outputFormat === 'plantuml' ? 'PlantUML' : 'Diagram'} code`
                    )}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Sao chép
                  </Button>
                </div>
                <pre className="bg-gray-50 border rounded p-3 text-sm overflow-x-auto max-h-64">
                  <code>{selectedItem.pumlCode || selectedItem.diagramCode || ''}</code>
                </pre>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Model: {selectedItem.model}</span>
                <span>
                  Tạo lúc: {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => {
                    handleLoadHistory(selectedItem);
                    setShowPreview(false);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Tải sơ đồ này
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}