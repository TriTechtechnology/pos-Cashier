'use client';

import { X, Gift, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoyaltyCard, LoyaltyReward } from '@/types/pos';

interface LoyaltyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  loyaltyCard: LoyaltyCard | null;
  onRedeemReward?: (reward: LoyaltyReward) => void;
  onApplyToOrder?: () => void;
}

const LoyaltyCardModal: React.FC<LoyaltyCardModalProps> = ({
  isOpen,
  onClose,
  loyaltyCard,
  onRedeemReward,
  onApplyToOrder
}) => {

  if (!isOpen || !loyaltyCard) return null;

  const availableRewards = loyaltyCard.rewards.filter(reward => !reward.isRedeemed);
  const progressPercentage = (loyaltyCard.stamps / loyaltyCard.maxStamps) * 100;

  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (onRedeemReward) {
      onRedeemReward(reward);
    }
  };

  const handleApplyToOrder = () => {
    if (onApplyToOrder) {
      onApplyToOrder();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Loyalty Card
          </CardTitle>
          <Button
            variant="icon-line"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Customer Info */}
                     <div className="flex items-center gap-3 p-4 bg-button-default rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Customer #{loyaltyCard.customerId}
              </h3>
              <p className="text-sm text-text-secondary">
                Last visit: {loyaltyCard.lastVisit ? new Date(loyaltyCard.lastVisit).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Stamps Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-text-primary">Stamps Progress</h4>
              <Badge variant="secondary" className="text-xs">
                {loyaltyCard.stamps} / {loyaltyCard.maxStamps}
              </Badge>
            </div>
            
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <p className="text-sm text-text-secondary">
              {loyaltyCard.maxStamps - loyaltyCard.stamps} more stamps needed for next reward
            </p>
          </div>

          <Separator />

          {/* Available Rewards */}
          <div className="space-y-3">
            <h4 className="font-medium text-text-primary flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" />
              Available Rewards
            </h4>
            
            {availableRewards.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No rewards available yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Collect more stamps to unlock rewards
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableRewards.map((reward) => (
                  <Card key={reward.id} className="border-l-4 border-l-success">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-text-primary">
                            {reward.name}
                          </h5>
                          <p className="text-sm text-text-secondary mt-1">
                            {reward.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {reward.stampsRequired} stamps
                            </Badge>
                            {reward.discount && (
                              <Badge variant="secondary" className="text-xs">
                                {reward.discount}% off
                              </Badge>
                            )}
                            {reward.freeItem && (
                              <Badge variant="secondary" className="text-xs">
                                Free {reward.freeItem}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleRedeemReward(reward)}
                          disabled={loyaltyCard.stamps < reward.stampsRequired}
                        >
                          Redeem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="line"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleApplyToOrder}
              className="flex-1"
              disabled={availableRewards.length === 0}
            >
              Apply to Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyCardModal;
